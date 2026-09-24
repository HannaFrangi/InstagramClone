// Removes the data created by scripts/seed.mjs, as far as firestore.rules allow.
//
//   node scripts/unseed.mjs
//
// Signs in as every seed account listed in scripts/.seed-users.json and, as
// that user: deletes notifications they sent or received, deletes their posts
// and bookmarks, removes their uid from other users' Followers and from likes /
// reposts on posts that aren't theirs, empties their own Following/posts lists,
// and finally deletes the Auth account.
//
// The rules forbid deleting users/{uid} docs and removing other people's
// comments, so those are left behind: the seed user docs are listed in
// scripts/.seed-leftover-users.txt for deletion from the Firebase console.

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  terminate,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const SEED_FILE = path.join(here, ".seed-users.json");
const LEFTOVER_FILE = path.join(here, ".seed-leftover-users.txt");
const START = Date.now();
const log = (msg) => console.log(`[${((Date.now() - START) / 1000).toFixed(0).padStart(4)}s] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadConfig() {
  const env = {};
  for (const line of readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

async function withRetry(fn, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (e?.code === "permission-denied" || attempt >= tries) throw e;
      await sleep(500 * 2 ** attempt);
    }
  }
}

// Delete a list of doc refs in batches of 400
async function deleteRefs(db, refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await withRetry(() => batch.commit());
  }
}

async function main() {
  if (!existsSync(SEED_FILE)) {
    console.error("scripts/.seed-users.json not found - nothing to unseed.");
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  const config = loadConfig();
  const seedUids = new Set(state.users.map((u) => u.uid));
  const failures = [];
  const counts = { notifications: 0, posts: 0, bookmarks: 0, likesRemoved: 0, repostsRemoved: 0, followersRemoved: 0, authDeleted: 0 };
  const fail = (step, user, e) => {
    failures.push({ step, user: user.username, error: `${e.code || ""} ${e.message}` });
    log(`FAILED ${step} for ${user.username}: ${e.code || e.message}`);
  };

  // Sign everyone in first
  const sessions = [];
  for (const [i, u] of state.users.entries()) {
    const app = initializeApp(config, `unseed-${i}-${Date.now()}`);
    const auth = getAuth(app);
    const db = getFirestore(app);
    for (let attempt = 1; ; attempt++) {
      try {
        await signInWithEmailAndPassword(auth, u.email, u.password);
        sessions.push({ ...u, app, auth, db });
        break;
      } catch (e) {
        if (e.code === "auth/too-many-requests" && attempt < 6) {
          log(`Auth throttled, waiting ${15 * attempt}s`);
          await sleep(15000 * attempt);
          continue;
        }
        if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
          log(`Account for ${u.username} no longer exists - skipping`);
          u.authGone = true;
        } else fail("sign in", u, e);
        break;
      }
    }
    await sleep(300);
  }
  log(`Signed in ${sessions.length}/${state.users.length} seed accounts`);

  // 1. notifications sent or received by each seed user
  for (const s of sessions) {
    try {
      const col = collection(s.db, "notifications");
      const [sent, received] = await Promise.all([
        getDocs(query(col, where("senderId", "==", s.uid))),
        getDocs(query(col, where("receiverId", "==", s.uid))),
      ]);
      const refs = new Map();
      [...sent.docs, ...received.docs].forEach((d) => refs.set(d.id, d.ref));
      await deleteRefs(s.db, [...refs.values()]);
      counts.notifications += refs.size;
    } catch (e) {
      fail("delete notifications", s, e);
    }
  }
  log(`Notifications deleted: ${counts.notifications}`);

  // 2. posts (originals, reposts, quotes) created by each seed user
  for (const s of sessions) {
    try {
      const snap = await getDocs(query(collection(s.db, "posts"), where("createdBy", "==", s.uid)));
      // Plain reposts of posts that aren't seed posts: take the uid off the original
      for (const d of snap.docs) {
        const x = d.data();
        if (x.repostOf && !x.caption) {
          await updateDoc(doc(s.db, "posts", x.repostOf), { reposts: arrayRemove(s.uid) }).catch(() => {});
        }
      }
      await deleteRefs(s.db, snap.docs.map((d) => d.ref));
      counts.posts += snap.size;
    } catch (e) {
      fail("delete posts", s, e);
    }
  }
  log(`Posts deleted: ${counts.posts}`);

  // 3. likes / reposts / Followers left on docs that aren't the seed user's own
  for (const s of sessions) {
    try {
      const posts = collection(s.db, "posts");
      const [liked, reposted, followed] = await Promise.all([
        getDocs(query(posts, where("likes", "array-contains", s.uid))),
        getDocs(query(posts, where("reposts", "array-contains", s.uid))),
        getDocs(query(collection(s.db, "users"), where("Followers", "array-contains", s.uid))),
      ]);
      for (const d of liked.docs) {
        await withRetry(() => updateDoc(d.ref, { likes: arrayRemove(s.uid) }));
        counts.likesRemoved++;
      }
      for (const d of reposted.docs) {
        await withRetry(() => updateDoc(d.ref, { reposts: arrayRemove(s.uid) }));
        counts.repostsRemoved++;
      }
      for (const d of followed.docs) {
        await withRetry(() => updateDoc(d.ref, { Followers: arrayRemove(s.uid) }));
        counts.followersRemoved++;
      }
    } catch (e) {
      fail("remove likes/reposts/follows", s, e);
    }
  }
  log(`Removed ${counts.likesRemoved} likes, ${counts.repostsRemoved} reposts, ${counts.followersRemoved} follower entries on remaining docs`);

  // 4. bookmarks + empty the (undeletable) profile doc's lists
  for (const s of sessions) {
    try {
      await withRetry(() => deleteDoc(doc(s.db, "bookmarks", s.uid)));
      counts.bookmarks++;
      await withRetry(() => updateDoc(doc(s.db, "users", s.uid), { Following: [], posts: [] }));
    } catch (e) {
      if (e.code === "not-found") continue;
      fail("delete bookmarks / clear profile lists", s, e);
    }
  }

  // Leftover user docs (rules: allow delete: if false)
  const leftoverLines = [
    "# Seed user docs that firestore.rules don't allow deleting (allow delete: if false).",
    "# Delete these users/{uid} documents from the Firebase console.",
    "# uid\tusername",
    ...state.users.map((u) => `${u.uid}\t${u.username}`),
  ];
  writeFileSync(LEFTOVER_FILE, leftoverLines.join("\n") + "\n");

  // 5. delete the Auth accounts, only for users whose data was fully cleaned
  const failedUsers = new Set(failures.map((f) => f.user));
  for (const s of sessions) {
    if (failedUsers.has(s.username)) continue;
    try {
      await s.auth.currentUser.delete();
      s.authGone = true;
      state.users.find((u) => u.uid === s.uid).authGone = true;
      counts.authDeleted++;
    } catch (e) {
      fail("delete auth account", s, e);
    }
  }
  log(`Auth accounts deleted: ${counts.authDeleted}`);
  for (const s of sessions) await terminate(s.db).catch(() => {});

  const allAuthGone = state.users.every((u) => u.authGone);
  if (!failures.length && allAuthGone) {
    unlinkSync(SEED_FILE);
    log("Removed scripts/.seed-users.json");
  } else {
    writeFileSync(SEED_FILE, JSON.stringify(state, null, 2));
    log("Kept scripts/.seed-users.json because something could not be cleaned - fix and re-run");
  }

  console.log("\n=== UNSEED SUMMARY ===");
  console.log(JSON.stringify({ durationSec: Math.round((Date.now() - START) / 1000), counts, failures }, null, 2));
  console.log(
    `\nKnown leftovers (not removable under firestore.rules):\n` +
      `  - ${state.users.length} seed users/{uid} docs -> listed in scripts/.seed-leftover-users.txt, delete them in the Firebase console\n` +
      `  - ${(state.targetComments || []).length} comment(s) seed users left on non-seed posts\n` +
      `  - any non-seed user's Following / bookmarks entries pointing at seed users or posts`
  );
  process.exit(failures.length ? 2 : 0);
}

main().catch((e) => {
  console.error(`Unseed aborted: ${e.code || ""} ${e.message}`);
  process.exit(1);
});
