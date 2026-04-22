import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const tracked = execSync("git ls-files src", { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((f) => f.replace(/\\/g, "/"));

const byLower = new Map();
for (const f of tracked) {
  byLower.set(f.toLowerCase(), f);
}

/** Return git-canonical path for a resolved import path, or null */
function findCanonical(absPath) {
  const norm = absPath.replace(/\\/g, "/");
  const tries = [norm, `${norm}.jsx`, `${norm}.js`];
  for (const t of tries) {
    const c = byLower.get(t.toLowerCase());
    if (c) return c;
  }
  return null;
}

const importRe =
  /from\s+["'](\.[^"']+)["']|import\s+["'](\.[^"']+)["']/g;

const errors = [];

for (const file of tracked.filter((f) => f.endsWith(".js") || f.endsWith(".jsx"))) {
  const text = fs.readFileSync(file, "utf8");
  importRe.lastIndex = 0;
  let m;
  while ((m = importRe.exec(text))) {
    const spec = m[1] || m[2];
    if (!spec.startsWith(".")) continue;
    const dir = path.posix.dirname(file);
    const abs = path.posix.normalize(path.posix.join(dir, spec));
    const canonical = findCanonical(abs);
    if (!canonical) {
      errors.push({ file, import: spec, resolvedAs: abs, issue: "UNRESOLVED" });
      continue;
    }
    if (canonical === abs) continue;
    if (canonical === `${abs}.js` || canonical === `${abs}.jsx`) continue;
    if (canonical.toLowerCase() === abs.toLowerCase()) {
      errors.push({
        file,
        import: spec,
        resolvedAs: abs,
        canonical,
        issue: "CASE_MISMATCH",
      });
    }
  }
}

if (errors.length) {
  console.log(JSON.stringify(errors, null, 2));
  process.exit(1);
}
console.log("OK: all relative imports match git paths (case-sensitive)");
