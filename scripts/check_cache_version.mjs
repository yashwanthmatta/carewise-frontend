// Fails when a file the pages load as "file?v=carewise-product-N" changed but N did not.
// The service worker serves those files cache-first, so without a new N returning visitors
// keep the old file next to the new page. Two branches that each bump 195 -> 196 hit exactly
// this when both merge.
//
// Usage: node scripts/check_cache_version.mjs <base-commit>   (defaults to HEAD^1)
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, normalize } from "node:path";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const base = process.argv[2] || "HEAD^1";
try {
  git("cat-file", "-e", `${base}^{commit}`);
} catch {
  console.log(`Base ${base} is not available (first push or shallow clone); skipping.`);
  process.exit(0);
}

const versionOf = (text) => (text.match(/carewise-product-(\d+)/) || [])[1];

// Every file a page loads with ?v=carewise-product-N.
const pages = [...readdirSync(".").filter((f) => f.endsWith(".html")), ...readdirSync("legal").filter((f) => f.endsWith(".html")).map((f) => join("legal", f))];
const versioned = new Set(["sw.js"]);
for (const page of pages) {
  const dir = page.includes("/") ? "legal" : ".";
  for (const [, ref] of readFileSync(page, "utf8").matchAll(/(?:src|href)="([^"?]+)\?v=carewise-product-\d+"/g)) {
    versioned.add(normalize(join(dir, ref.replace(/^\//, ""))));
  }
}

// Every page must ask for the current version. A page left on an old number (the legal pages sat on
// 20 while sw.js was at 232, found 17 Nov) keeps whatever an old visit cached and never gets the
// new file. Bumping by replacing only the current number misses them, so check every page.
const current = versionOf(readFileSync("sw.js", "utf8"));
const stale = [];
for (const page of pages) {
  for (const [, version] of readFileSync(page, "utf8").matchAll(/\?v=carewise-product-(\d+)/g)) {
    if (version !== current) stale.push(`${page} (carewise-product-${version})`);
  }
}
if (stale.length) {
  console.error(`These pages load files at an old cache version; sw.js is at ${current}:`);
  for (const line of [...new Set(stale)]) console.error(`  ${line}`);
  process.exit(1);
}

const changed = git("diff", "--name-only", base, "HEAD").split("\n").filter(Boolean);
const changedVersioned = changed.filter((file) => versioned.has(file) && file !== "sw.js");
const before = versionOf(git("show", `${base}:sw.js`));
const after = versionOf(readFileSync("sw.js", "utf8"));

if (changedVersioned.length && before === after) {
  console.error(`These cached files changed but the cache version is still ${after}:`);
  for (const file of changedVersioned) console.error(`  ${file}`);
  console.error(`Bump carewise-product-${after} (and shell-v${after}) in index.html, sw.js and every page that loads them.`);
  process.exit(1);
}
console.log(changedVersioned.length
  ? `Cache version ${before} -> ${after} covers ${changedVersioned.length} changed cached file(s).`
  : "No cached files changed.");
