// Seeds the Firebase project from .env with realistic, clearly-marked test data.
//
//   node scripts/seed.mjs            (refuses if scripts/.seed-users.json exists)
//   node scripts/seed.mjs --force    (seeds again anyway, overwriting the file)
//   node scripts/seed.mjs --resume   (continue an interrupted run: signs back in as
//                                     the recorded seed users and redoes only the
//                                     phases not marked done in .seed-users.json)
//   SEED_TARGET_USERNAME=someone node scripts/seed.mjs
//       also has seed users follow / like / comment on / mention an existing user
//
// Every write goes through the client SDK signed in as the seed user it
// concerns, so it passes firestore.rules exactly like the app does. Seed
// accounts (emails, passwords, uids) are stored in scripts/.seed-users.json so
// `node scripts/unseed.mjs` can sign in as them and remove everything again.
// Users, posts and notifications created here also carry `seed: true`.

import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  terminate,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { extractHashtags, extractMentions } from "../src/utils/postText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const SEED_FILE = path.join(here, ".seed-users.json");
const FORCE = process.argv.includes("--force");
const RESUME = process.argv.includes("--resume");
const TARGET_USERNAME = (process.env.SEED_TARGET_USERNAME || "").trim().toLowerCase();

// ---------------------------------------------------------------- config
function loadConfig() {
  const env = {};
  for (const line of readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  const missing = Object.entries(cfg).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing Firebase config in .env: ${missing.join(", ")}`);
  return cfg;
}

// ---------------------------------------------------------------- helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sample = (arr, n) => shuffle(arr).slice(0, n);
const between = (lo, hi) => lo + rand(hi - lo + 1);
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const NOW = Date.now();
const clampPast = (ms) => Math.min(ms, NOW - between(1, 30) * 60 * 1000);
const log = (msg) => console.log(`[${((Date.now() - NOW) / 1000).toFixed(0).padStart(4)}s] ${msg}`);

const isPermissionError = (e) => e?.code === "permission-denied" || e?.code === "firestore/permission-denied";

async function withRetry(fn, label, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (isPermissionError(e) || attempt >= tries) {
        e.opLabel = label;
        throw e;
      }
      await sleep(500 * 2 ** attempt);
    }
  }
}

async function runPool(items, concurrency, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

// Per-category bookkeeping: a permission error stops the category
const failures = [];
const stopped = new Set();
async function guarded(category, label, fn) {
  if (stopped.has(category)) return undefined;
  try {
    return await withRetry(fn, label);
  } catch (e) {
    if (isPermissionError(e)) {
      if (!stopped.has(category)) {
        stopped.add(category);
        failures.push({ category, op: label, error: `${e.code}: ${e.message}`, stoppedCategory: true });
        log(`PERMISSION DENIED in "${category}" on ${label} - stopping this category`);
      }
    } else {
      failures.push({ category, op: label, error: `${e.code || ""} ${e.message}` });
      log(`FAILED ${label}: ${e.code || e.message}`);
    }
    return undefined;
  }
}

// ---------------------------------------------------------------- content
const PEOPLE = [
  ["maya.lopez", "Maya Lopez"], ["liam.chen", "Liam Chen"], ["sofia.rossi", "Sofia Rossi"],
  ["noah_bennett", "Noah Bennett"], ["amara.okafor", "Amara Okafor"], ["lucas.meyer", "Lucas Meyer"],
  ["yuki.tanaka", "Yuki Tanaka"], ["elena.petrova", "Elena Petrova"], ["omar.haddad", "Omar Haddad"],
  ["chloe.martin", "Chloe Martin"], ["diego.alvarez", "Diego Alvarez"], ["hana.kim", "Hana Kim"],
  ["jonas.berg", "Jonas Berg"], ["priya.nair", "Priya Nair"], ["samuel.adeyemi", "Samuel Adeyemi"],
  ["zoe.dubois", "Zoe Dubois"], ["mateo.silva", "Mateo Silva"], ["aisha.rahman", "Aisha Rahman"],
  ["ethan.walsh", "Ethan Walsh"], ["nina.kowalski", "Nina Kowalski"], ["leo.fischer", "Leo Fischer"],
  ["isabel.costa", "Isabel Costa"], ["kai.nakamura", "Kai Nakamura"], ["grace.obrien", "Grace O'Brien"],
  ["felix.moreau", "Felix Moreau"],
];

const BIOS = [
  "Coffee first, questions later.", "Frontend dev by day, amateur baker by night.",
  "Chasing sunsets and good espresso.", "Designer. Plant parent. Runs on oat milk.",
  "Collecting stamps in my passport and bugs in my code.", "Weekend hiker, weekday spreadsheet wrangler.",
  "Film photos, long walks, loud music.", "Reading too many books at once.",
  "Learning something new every day.", "Based somewhere between the gym and the kitchen.",
  "Product person. Opinions are my own.", "Always planning the next trip.",
  "Guitar, trail runs, and bad puns.", "Here for the food pics.", "Making things on the internet.",
];

const HASHTAGS = [
  "photography", "travel", "coffee", "fitness", "foodie", "coding", "music", "sunset",
  "bookclub", "design", "hiking", "citylife", "nature", "weekend", "mondaymotivation",
];

const TOPICS = {
  coffee: [
    "Third cup of the day and it's not even noon. Send help (or more beans).",
    "Found a tiny café that does a perfect cortado. Not telling anyone where it is.",
    "Pour-over experiments continue. Today's verdict: 15g to 250g is the sweet spot.",
    "Oat milk flat white beats everything else. Fight me.",
  ],
  coding: [
    "Spent two hours debugging only to find a missing await. Classic.",
    "Finally shipped the side project I've been sitting on for months. Feels good.",
    "Hot take: most bugs are naming problems in disguise.",
    "Refactored 400 lines down to 120 today. Deleting code is the best feeling.",
    "Pair programming session turned into a two-hour architecture debate. Worth it.",
  ],
  travel: [
    "Landed in Lisbon and already obsessed with the tiles on every building.",
    "Train window seat, headphones in, no wifi. Perfect afternoon.",
    "Tips for Kyoto in autumn? Going next month and want to skip the crowds.",
    "Missed my connecting flight but found the best noodle place in the airport, so who's really winning.",
  ],
  fitness: [
    "New PR on deadlifts today. Slow progress is still progress.",
    "5am run done before the city woke up. Worth the alarm.",
    "Rest days are part of the program. Repeating that to myself all afternoon.",
    "Tried a reformer pilates class. My core is filing a complaint.",
  ],
  foodie: [
    "Homemade ramen night: 12 hours of broth for 10 minutes of eating. No regrets.",
    "Best tacos I've had outside of Mexico City, right around the corner from my apartment.",
    "Seventh sourdough attempt finally has an ear. I'm emotional.",
    "Sunday brunch rankings: shakshuka takes the crown again.",
  ],
  music: [
    "This album has been on repeat all week and I'm not tired of it yet.",
    "Saw a tiny jazz trio last night in a basement bar. Easily the best show this year.",
    "Finally learned the bridge of that song I've been practicing on guitar for a month.",
    "Making a playlist for a long drive. Drop your non-skip songs below.",
  ],
  sunset: [
    "Tonight's sky did not need a filter.",
    "Rooftop, golden hour, good company. Can't ask for much more.",
    "Stopped the car on the way home just to watch this one.",
  ],
  bookclub: [
    "Finished Piranesi in one sitting. What should I read next?",
    "Book club picked a 700-page novel for this month. Wish us luck.",
    "Reading on the balcony with my phone in another room. Highly recommend.",
  ],
  design: [
    "Spent the morning adjusting kerning on a logo nobody will notice. Worth it.",
    "Whitespace is not empty space, it's breathing room.",
    "Redesigned my portfolio for the fourth time this year. It's a hobby now.",
    "Good onboarding is invisible. Bad onboarding is all anyone remembers.",
  ],
  hiking: [
    "12 km, 800 m of elevation and one very judgmental goat.",
    "Trail was muddy, views were unreal, boots are ruined. 10/10.",
    "Summit lunch hits different.",
  ],
  citylife: [
    "Rainy commute, good podcast, warm bagel. Small wins.",
    "The city sounds different at 6am. Kind of love it.",
    "New bike lane on my street and my commute got 15 minutes shorter.",
  ],
  nature: [
    "Found a patch of wildflowers on my lunch walk and just stood there for a while.",
    "The lake was completely still this morning.",
    "Forest bathing is just walking slowly and I'm here for it.",
  ],
  weekend: [
    "Weekend plan: farmers market, long nap, zero emails.",
    "Cleaned the whole apartment and rearranged the plants. Productive Saturday.",
    "Lazy Sunday, pancakes, and an old movie.",
  ],
  mondaymotivation: [
    "Monday reminder: done is better than perfect.",
    "Small steps every day. That's the whole trick.",
    "New week, fresh to-do list, same coffee mug.",
  ],
  photography: [
    "Shot a whole roll of film on the walk home. Can't wait to see what came out.",
    "Morning light through the kitchen window. Didn't even have to try.",
    "Still learning manual mode but this one came out exactly how I saw it.",
  ],
};
const IMAGE_TOPICS = ["travel", "foodie", "sunset", "nature", "hiking", "photography", "coffee", "citylife", "weekend", "design"];
const MENTION_TEMPLATES = [" with @{u}", " h/t @{u}", " @{u} you'd love this", " Shoutout to @{u}!", " Thanks @{u} for the recommendation."];

const COMMENTS = [
  "Love this!", "Where is this??", "Okay now I need to go there.", "Saving this for later.",
  "Couldn't agree more.", "Haha same.", "This made my day.", "Need the recipe asap.",
  "Congrats, well deserved!", "Obsessed with this shot.", "Adding it to my list.",
  "You always find the best spots.", "Big mood.", "How long did this take?", "Teach me your ways.",
  "The colors in this 😍", "Wait, this is actually genius.", "Been there, can confirm it's amazing.",
  "Okay this is the push I needed today.", "Say less, I'm in.", "🔥🔥🔥", "Goals.",
];
const MENTION_COMMENTS = ["@{u} we have to go here", "@{u} look at this!", "@{u} this is so you", "@{u} remember when we tried this?"];

const QUOTES = [
  "This is exactly what I needed to read today.", "Adding this to my list, thanks for sharing!",
  "Honestly the best take on this I've seen.", "Can confirm, 100% true.",
  "We need to talk about this more.", "Okay I'm convinced. Trying this weekend.",
  "Saving this so I don't forget.", "Couldn't have said it better myself.",
  "This is why I follow you.", "Same energy as my entire week.",
];

function makeCaption(topic, { mention } = {}) {
  let text = pick(TOPICS[topic]);
  if (mention) text += pick(MENTION_TEMPLATES).replace("{u}", mention);
  const tags = new Set([topic]);
  if (chance(0.5)) tags.add(pick(HASHTAGS));
  if (chance(0.2)) tags.add(pick(HASHTAGS));
  const tagStr = [...tags].map((t) => `#${t}`).join(" ");
  const out = chance(0.85) ? `${text} ${tagStr}` : text; // a few posts without tags
  return out.slice(0, 280);
}

// ---------------------------------------------------------------- main
async function main() {
  if (RESUME && !existsSync(SEED_FILE)) {
    console.error("--resume needs scripts/.seed-users.json from an earlier run.");
    process.exit(1);
  }
  if (existsSync(SEED_FILE) && !FORCE && !RESUME) {
    console.error(
      "scripts/.seed-users.json already exists, so seed data is probably already in the project.\n" +
        "Remove it first with `npm run unseed` (node scripts/unseed.mjs), or re-run with --force to seed again."
    );
    process.exit(1);
  }
  const config = loadConfig();
  log(`Seeding project (config loaded from .env)${TARGET_USERNAME ? " with a target user" : ""}`);

  const state = RESUME
    ? JSON.parse(readFileSync(SEED_FILE, "utf8"))
    : { createdAt: new Date().toISOString(), users: [], target: null, targetComments: [], phasesDone: [] };
  state.phasesDone ||= [];
  state.targetComments ||= [];
  const save = () => {
    writeFileSync(SEED_FILE, JSON.stringify(state, null, 2));
    chmodSync(SEED_FILE, 0o600);
  };
  save();
  const skip = (phase) => {
    const done = state.phasesDone.includes(phase);
    if (done) log(`Skipping ${phase} (already done)`);
    return done;
  };
  const phaseDone = (phase) => {
    state.phasesDone.push(phase);
    save();
  };

  // ---------------------------------------------- 1. accounts + profiles
  const users = []; // { uid, username, fullName, email, password, app, db, auth }
  const takenCheck = new Set();
  let namesChecked = false;
  const people = [...PEOPLE];

  if (RESUME) {
    if (!state.phasesDone.includes("users")) {
      throw new Error("The earlier run stopped while creating accounts; run `npm run unseed` and seed again.");
    }
    for (const [i, entry] of state.users.entries()) {
      const app = initializeApp(config, `seed-${i}-${Date.now()}`);
      const auth = getAuth(app);
      const db = getFirestore(app);
      await withRetry(() => signInWithEmailAndPassword(auth, entry.email, entry.password), `sign in #${i}`);
      users.push({ ...entry, app, db, auth });
      await sleep(300);
    }
    log(`Signed back in as ${users.length} seed users`);
  }

  for (let i = 0; i < people.length && !RESUME; i++) {
    let [username, fullName] = people[i];
    const app = initializeApp(config, `seed-${i}-${Date.now()}`);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const password = randomBytes(18).toString("base64url") + "A1!";
    let email = `seed.${username}@example.com`;
    let cred;
    for (let attempt = 1; ; attempt++) {
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
        break;
      } catch (e) {
        if (e.code === "auth/too-many-requests" && attempt < 6) {
          const wait = 15000 * attempt;
          log(`Auth throttled, waiting ${wait / 1000}s`);
          await sleep(wait);
        } else if (e.code === "auth/email-already-in-use" && attempt < 4) {
          email = `seed.${username}.${randomBytes(2).toString("hex")}@example.com`;
        } else {
          throw new Error(`Could not create auth account #${i}: ${e.code || e.message}`);
        }
      }
    }
    const uid = cred.user.uid;
    const entry = { uid, email, password, username };
    state.users.push(entry);
    save();

    // Once signed in, check which usernames are already taken by real users
    if (!namesChecked) {
      const names = people.map((p) => p[0]);
      const snap = await getDocs(query(collection(db, "users"), where("username", "in", names)));
      snap.forEach((d) => takenCheck.add(d.data().username));
      namesChecked = true;
      if (takenCheck.size) log(`${takenCheck.size} username(s) already taken - adding suffixes`);
    }
    if (takenCheck.has(username)) {
      username = `${username}_${between(10, 99)}`;
      entry.username = username;
      save();
    }

    const userDoc = {
      uid,
      email,
      username,
      fullName,
      bio: pick(BIOS),
      profilePicURL: `https://i.pravatar.cc/300?u=${username}`,
      Followers: [],
      Following: [],
      posts: [],
      createdAt: NOW - between(31, 45) * DAY - rand(DAY),
      seed: true,
    };
    await withRetry(() => setDoc(doc(db, "users", uid), userDoc), `create users/${uid}`);
    users.push({ ...entry, fullName, app, db, auth });
    log(`User ${i + 1}/${people.length} created`);
    await sleep(1200);
  }
  if (!RESUME) phaseDone("users");
  const seedUids = new Set(users.map((u) => u.uid));
  const counts = { follows: 0, posts: 0, imagePosts: 0, textPosts: 0, reposts: 0, quotes: 0, likes: 0, comments: 0, bookmarks: 0, notifications: {} };
  const bumpNotif = (type) => (counts.notifications[type] = (counts.notifications[type] || 0) + 1);

  // Notification exactly as src/utils/notifications.js creates it (+ seed flag)
  const notify = async (sender, { receiverId, type, postId, sourcePostId = null, at }) => {
    if (!receiverId || receiverId === sender.uid) return;
    const ok = await guarded(`notifications:${type}`, `create notification (${type}) as ${sender.username}`, () =>
      addDoc(collection(sender.db, "notifications"), {
        receiverId,
        senderId: sender.uid,
        type,
        postId,
        sourcePostId,
        isRead: false,
        createdAt: new Date(at ?? Date.now()),
        seed: true,
      })
    );
    if (ok) bumpNotif(type);
  };

  // Username -> uid for mentions (seed users + optional target)
  const uidByUsername = new Map(users.map((u) => [u.username, u.uid]));

  const notifyMentions = async (sender, text, postId, at) => {
    for (const name of extractMentions(text)) {
      const receiverId = uidByUsername.get(name);
      if (receiverId) await notify(sender, { receiverId, type: "mention", postId, at });
    }
  };

  // ---------------------------------------------- optional target user
  let target = state.target || null;
  if (target) uidByUsername.set(target.username, target.uid);
  else if (TARGET_USERNAME && !state.phasesDone.includes("follows")) {
    const snap = await getDocs(query(collection(users[0].db, "users"), where("username", "==", TARGET_USERNAME)));
    const d = snap.docs[0];
    if (!d) log(`Target user not found - continuing without one`);
    else if (seedUids.has(d.id)) log(`Target user is a seed user - ignoring`);
    else {
      target = { uid: d.id, username: d.data().username };
      state.target = target;
      save();
      uidByUsername.set(target.username, target.uid);
      log(`Target user found`);
    }
  }

  // ---------------------------------------------- 2. follow graph
  if (!skip("follows")) {
  log("Building follow graph");
  const followTasks = [];
  for (const u of users) {
    const others = users.filter((o) => o.uid !== u.uid);
    for (const o of sample(others, between(5, 20))) followTasks.push([u, o.uid]);
  }
  if (target) for (const u of sample(users, Math.min(15, users.length))) followTasks.push([u, target.uid]);

  await runPool(shuffle(followTasks), 10, async ([u, targetUid]) => {
    const at = NOW - between(20, 30) * DAY - rand(DAY);
    const a = await guarded("follows", `users/${u.uid}.Following arrayUnion (as ${u.username})`, () =>
      updateDoc(doc(u.db, "users", u.uid), { Following: arrayUnion(targetUid) }).then(() => true)
    );
    if (!a) return;
    const b = await guarded("follows", `users/<other>.Followers arrayUnion own uid (as ${u.username})`, () =>
      updateDoc(doc(u.db, "users", targetUid), { Followers: arrayUnion(u.uid) }).then(() => true)
    );
    if (!b) return;
    counts.follows++;
    await notify(u, { receiverId: targetUid, type: "follow", postId: null, at });
  });
  log(`Follows done: ${counts.follows}`);
  if (!stopped.has("follows")) phaseDone("follows");
  }

  // ---------------------------------------------- 3. original posts
  const allPosts = []; // { id, createdBy, createdAt, caption, isImage, kind }
  if (!skip("posts")) {
  log("Creating posts");
  const POSTS_PER_USER = 15;
  const targetMentionSlots = new Set();
  if (target) {
    // ~5 seed posts mention the target
    for (let k = 0; k < 5; k++) targetMentionSlots.add(`${rand(users.length)}:${rand(POSTS_PER_USER)}`);
  }
  await runPool(users, 8, async (u) => {
    const times = Array.from({ length: POSTS_PER_USER }, () => clampPast(NOW - rand(30 * DAY)))
      .sort((a, b) => a - b);
    const idx = users.indexOf(u);
    for (let k = 0; k < POSTS_PER_USER; k++) {
      if (stopped.has("posts")) return;
      const isImage = chance(0.4);
      const topic = isImage ? pick(IMAGE_TOPICS) : pick(Object.keys(TOPICS));
      let mention = null;
      if (targetMentionSlots.has(`${idx}:${k}`)) mention = target.username;
      else if (chance(0.18)) mention = pick(users.filter((o) => o.uid !== u.uid)).username;
      const caption = makeCaption(topic, { mention });
      const createdAt = times[k];
      const post = {
        caption,
        hashtags: extractHashtags(caption),
        likes: [],
        comments: [],
        reposts: [],
        createdAt,
        createdBy: u.uid,
        seed: true,
      };
      const ref = await guarded("posts", `create post (as ${u.username})`, () => addDoc(collection(u.db, "posts"), post));
      if (!ref) continue;
      await guarded("posts", `users/${u.uid}.posts arrayUnion (as ${u.username})`, () =>
        updateDoc(doc(u.db, "users", u.uid), { posts: arrayUnion(ref.id) })
      );
      if (isImage) {
        const ok = await guarded("images", `posts/${ref.id} set imageURL (as ${u.username})`, () =>
          updateDoc(ref, { imageURL: `https://picsum.photos/seed/${u.username}-${ref.id}/1080/1080` }).then(() => true)
        );
        if (ok) counts.imagePosts++;
      } else counts.textPosts++;
      counts.posts++;
      allPosts.push({ id: ref.id, createdBy: u.uid, createdAt, caption, isImage, kind: "original" });
      await notifyMentions(u, caption, ref.id, createdAt);
    }
  });
  log(`Posts done: ${counts.posts}`);
  if (!stopped.has("posts")) phaseDone("posts");
  } else {
    // Rebuild the post list from Firestore
    const snap = await getDocs(query(collection(users[0].db, "posts"), where("createdBy", "in", [...seedUids].slice(0, 30))));
    snap.forEach((d) => {
      const x = d.data();
      const kind = x.repostOf ? (x.caption ? "quote" : "repost") : "original";
      allPosts.push({ id: d.id, createdBy: x.createdBy, createdAt: x.createdAt, caption: x.caption, isImage: !!x.imageURL, kind, repostOf: x.repostOf });
    });
    log(`Loaded ${allPosts.length} existing seed posts`);
  }

  // Popularity: a handful of posts get most of the engagement
  const originals = allPosts.filter((p) => p.kind === "original");
  // Persisted so a --resume run keeps the same popular posts
  state.popular ||= sample(originals, Math.round(originals.length * 0.05)).map((p) => p.id);
  save();
  const popular = new Set(state.popular);
  const popularPosts = originals.filter((p) => popular.has(p.id));
  const weightedOriginal = () => (chance(0.35) && popularPosts.length ? pick(popularPosts) : pick(originals));

  // ---------------------------------------------- 4. reposts + quotes
  if (!skip("reposts")) {
  log("Creating reposts and quotes");
  const repostPairs = new Set();
  const repostPlan = [];
  const planShare = (kind, n) => {
    let guard = 0;
    while (repostPlan.filter((r) => r.kind === kind).length < n && guard++ < 1000) {
      const orig = weightedOriginal();
      const u = pick(users);
      const key = `${kind}:${u.uid}:${orig.id}`;
      if (u.uid === orig.createdBy || repostPairs.has(key)) continue;
      repostPairs.add(key);
      repostPlan.push({ kind, u, orig });
    }
  };
  planShare("repost", 30);
  planShare("quote", 20);

  await runPool(shuffle(repostPlan), 6, async ({ kind, u, orig }) => {
    const category = kind === "repost" ? "reposts" : "quotes";
    if (stopped.has(category)) return;
    const createdAt = clampPast(orig.createdAt + between(1, 72) * HOUR);
    let caption = "";
    if (kind === "quote") {
      const mention = chance(0.25) ? pick(users.filter((o) => o.uid !== u.uid && o.uid !== orig.createdBy)).username : null;
      caption = pick(QUOTES) + (mention ? ` @${mention}` : "") + (chance(0.4) ? ` #${pick(HASHTAGS)}` : "");
    }
    const ref = await guarded(category, `create ${kind} post (as ${u.username})`, () =>
      addDoc(collection(u.db, "posts"), {
        caption,
        hashtags: extractHashtags(caption),
        repostOf: orig.id,
        likes: [],
        comments: [],
        reposts: [],
        createdAt,
        createdBy: u.uid,
        seed: true,
      })
    );
    if (!ref) return;
    await guarded(category, `users/${u.uid}.posts arrayUnion ${kind} (as ${u.username})`, () =>
      updateDoc(doc(u.db, "users", u.uid), { posts: arrayUnion(ref.id) })
    );
    if (kind === "repost") {
      const ok = await guarded(category, `posts/${orig.id}.reposts arrayUnion own uid (as ${u.username})`, () =>
        updateDoc(doc(u.db, "posts", orig.id), { reposts: arrayUnion(u.uid) }).then(() => true)
      );
      if (!ok) return;
      counts.reposts++;
      await notify(u, { receiverId: orig.createdBy, type: "repost", postId: orig.id, sourcePostId: ref.id, at: createdAt });
    } else {
      counts.quotes++;
      await notify(u, { receiverId: orig.createdBy, type: "quote", postId: ref.id, at: createdAt });
      await notifyMentions(u, caption, ref.id, createdAt);
    }
    allPosts.push({ id: ref.id, createdBy: u.uid, createdAt, caption, isImage: false, kind });
  });
  log(`Reposts: ${counts.reposts}, quotes: ${counts.quotes}`);
  if (!stopped.has("reposts") && !stopped.has("quotes")) phaseDone("reposts");
  }

  // Target's own posts (only when a target was given)
  let targetPosts = [];
  if (target) {
    const snap = await getDocs(query(collection(users[0].db, "posts"), where("createdBy", "==", target.uid)));
    targetPosts = snap.docs
      .map((d) => ({ id: d.id, createdBy: target.uid, createdAt: d.data().createdAt || NOW - 7 * DAY, kind: d.data().repostOf && !d.data().caption ? "repost" : "original", external: true }))
      .filter((p) => p.kind !== "repost");
    log(`Target has ${targetPosts.length} likeable post(s)`);
  }

  // ---------------------------------------------- 5. likes
  const likeable = allPosts.filter((p) => p.kind !== "repost");
  if (!skip("likes")) {
  log("Adding likes");
  const likeTasks = [];
  for (const p of likeable) {
    let n;
    if (popular.has(p.id)) n = between(14, 20);
    else n = Math.floor(12 * Math.random() ** 2.5);
    const likers = sample(users.filter((u) => u.uid !== p.createdBy), Math.min(n, 20));
    for (const u of likers) likeTasks.push({ p, u });
  }
  for (const p of targetPosts) {
    if (!chance(0.6)) continue;
    for (const u of sample(users, between(1, 6))) likeTasks.push({ p, u });
  }
  await runPool(shuffle(likeTasks), 12, async ({ p, u }) => {
    const ok = await guarded("likes", `posts/${p.id}.likes arrayUnion own uid (as ${u.username})`, () =>
      updateDoc(doc(u.db, "posts", p.id), { likes: arrayUnion(u.uid) }).then(() => true)
    );
    if (!ok) return;
    counts.likes++;
    await notify(u, { receiverId: p.createdBy, type: "like", postId: p.id, at: clampPast(p.createdAt + rand(48 * HOUR)) });
  });
  log(`Likes done: ${counts.likes}`);
  if (!stopped.has("likes")) phaseDone("likes");
  }

  // ---------------------------------------------- 6. comments
  if (!skip("comments")) {
  log("Adding comments");
  const COMMENT_DIST = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  const commentPosts = [];
  for (const p of likeable) {
    const n = popular.has(p.id) ? between(3, 6) : pick(COMMENT_DIST);
    if (n) commentPosts.push({ p, n });
  }
  for (const p of targetPosts) if (chance(0.4)) commentPosts.push({ p, n: between(1, 3) });

  await runPool(shuffle(commentPosts), 10, async ({ p, n }) => {
    const authors = Array.from({ length: n }, () => pick(users.filter((u) => u.uid !== p.createdBy)));
    let t = p.createdAt;
    for (const u of authors) {
      if (stopped.has("comments")) return;
      t = clampPast(t + between(5, 600) * 60 * 1000);
      let text = pick(COMMENTS);
      if (chance(0.15)) {
        const friend = pick(users.filter((o) => o.uid !== u.uid));
        text = pick(MENTION_COMMENTS).replace("{u}", friend.username);
      }
      const newComment = { comment: text, createdAt: t, createdBy: u.uid, postId: p.id };
      const ok = await guarded("comments", `posts/${p.id}.comments arrayUnion one comment (as ${u.username})`, () =>
        updateDoc(doc(u.db, "posts", p.id), { comments: arrayUnion(newComment) }).then(() => true)
      );
      if (!ok) continue;
      counts.comments++;
      if (p.external) {
        state.targetComments.push(newComment);
        save();
      }
      await notify(u, { receiverId: p.createdBy, type: "comment", postId: p.id, at: t });
      await notifyMentions(u, text, p.id, t);
    }
  });
  log(`Comments done: ${counts.comments}`);
  if (!stopped.has("comments")) phaseDone("comments");
  }

  // ---------------------------------------------- 7. bookmarks
  if (!skip("bookmarks")) {
  log("Adding bookmarks");
  await runPool(sample(users, 12), 6, async (u) => {
    const ids = sample(likeable.filter((p) => p.createdBy !== u.uid && !p.external), between(2, 8)).map((p) => p.id);
    const ok = await guarded("bookmarks", `set bookmarks/${u.uid} (as ${u.username})`, () =>
      setDoc(doc(u.db, "bookmarks", u.uid), { postIds: ids }).then(() => true)
    );
    if (ok) counts.bookmarks += ids.length;
  });
  if (!stopped.has("bookmarks")) phaseDone("bookmarks");
  }

  // ---------------------------------------------- 8. verify by reading back
  log("Verifying by reading back");
  const v = { users: 0, follows: 0, posts: { total: 0, text: 0, image: 0, repost: 0, quote: 0 }, likes: 0, comments: 0, repostsField: 0, bookmarkDocs: 0, bookmarks: 0, notifications: {} };
  const reader = users[0].db;
  const uids = users.map((u) => u.uid);
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const us = await getDocs(query(collection(reader, "users"), where("uid", "in", chunk)));
    us.forEach((d) => {
      v.users++;
      v.follows += (d.data().Following || []).length;
    });
    const ps = await getDocs(query(collection(reader, "posts"), where("createdBy", "in", chunk)));
    ps.forEach((d) => {
      const x = d.data();
      v.posts.total++;
      if (x.repostOf) x.caption ? v.posts.quote++ : v.posts.repost++;
      else x.imageURL ? v.posts.image++ : v.posts.text++;
      v.likes += x.likes.length;
      v.comments += x.comments.length;
      v.repostsField += (x.reposts || []).length;
    });
  }
  for (const u of users) {
    const b = await getDoc(doc(u.db, "bookmarks", u.uid));
    if (b.exists()) {
      v.bookmarkDocs++;
      v.bookmarks += b.data().postIds.length;
    }
    const ns = await getDocs(query(collection(u.db, "notifications"), where("senderId", "==", u.uid)));
    ns.forEach((d) => {
      const t = d.data().type;
      v.notifications[t] = (v.notifications[t] || 0) + 1;
    });
  }
  v.notifications.total = Object.values(v.notifications).reduce((a, b) => a + b, 0);

  state.completedAt = new Date().toISOString();
  save();

  for (const u of users) {
    await signOut(u.auth).catch(() => {});
    await terminate(u.db).catch(() => {});
  }

  const summary = {
    durationSec: Math.round((Date.now() - NOW) / 1000),
    written: counts,
    verified: v,
    target: target ? "yes" : "no",
    failures,
  };
  console.log("\n=== SEED SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log("\nTo remove it all: npm run unseed");
  process.exit(failures.length ? 2 : 0);
}

main().catch((e) => {
  console.error(`Seed aborted: ${e.opLabel ? e.opLabel + " -> " : ""}${e.code || ""} ${e.message}`);
  console.error("Whatever was created is recorded in scripts/.seed-users.json; run `npm run unseed` to remove it.");
  process.exit(1);
});
