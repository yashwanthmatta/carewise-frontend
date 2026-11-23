// The clinician validation pack must match the rules the site runs (roadmap B4, 22 Nov 2026).
// The pack sent to a reviewer was frozen at .2 and copied at .5 while the site moved on to .8,
// so a reviewer would have judged outputs the site no longer shows. This regenerates the pack
// from the live rules and fails if any case's output differs from the committed pack for the
// current rules version, or if no pack exists for it.
// Fix: node scripts/clinical/export-validation-cases.mjs docs/clinical-validation/validation-cases.csv \
//        docs/clinical-validation-<version> docs/clinical-validation-<previous>/validation-cases.csv
// Usage: serve the site on :4173, then node scripts/eval/validation-pack-current.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const script = fs.readFileSync("script.js", "utf8");
const version = script.match(/const EXPLANATION_RULES_VERSION = "([^"]+)"/)?.[1];
const packDir = `docs/clinical-validation-${version}`;
const packCsv = path.join(packDir, "validation-cases.csv");
if (!version || !fs.existsSync(packCsv)) {
  console.log(`FAIL no validation pack for the live rules version ${version}: expected ${packCsv}`);
  process.exit(1);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pack-"));
const output = execFileSync("node", ["scripts/clinical/export-validation-cases.mjs", "docs/clinical-validation/validation-cases.csv", tmp, packCsv], { encoding: "utf8" });
const summary = output.split("\n").find((line) => line.startsWith("changes vs")) || "";
const changed = Number(summary.match(/: (\d+) cases/)?.[1] ?? NaN);
if (changed !== 0) {
  console.log(`FAIL the live rules ${version} give different output from the committed pack in ${changed} case(s). Regenerate the pack and tell the clinical reviewer what changed. (${summary})`);
  process.exit(1);
}
console.log(`ok   all 160 validation cases match the committed pack for rules ${version}`);
console.log("Validation pack is current");
