// Checks the help chat's built-in answers against the website, so a reply never
// sends someone to a button that doesn't exist or promises a feature that isn't live.
// Run: node scripts/eval/help-answers.mjs
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const help = read("help.js");
// Button and menu names can live in the page or be drawn by a script.
const site = ["index.html", "script.js", "docbridge.js", "reminders.js", "doctor-share.js", "twofactor.js"].map(read).join("\n");
const siteText = site.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");

const problems = [];

// 1. Names in quotes inside the English answers must appear somewhere on the site.
const topicsStart = help.indexOf("const TOPICS");
const topicsEnd = help.indexOf("es: [", topicsStart);
if (topicsStart < 0 || topicsEnd < 0) {
  problems.push("Could not find the English help answers (const TOPICS ... es: [) in help.js");
} else {
  const english = help.slice(topicsStart, topicsEnd);
  const quoted = [...english.matchAll(/\\"([^"\\]{3,80})\\"/g)].map((m) => m[1]);
  const notUiNames = new Set(["Add to Home Screen"]); // a browser menu item, not ours
  for (const name of new Set(quoted)) {
    if (notUiNames.has(name) || name.endsWith("?")) continue; // example questions to type, not buttons
    if (!siteText.includes(name)) problems.push(`Help answer mentions "${name}", but no button or label with that name is on the site`);
  }
  if (quoted.length < 5) problems.push(`Expected several quoted button names in the help answers, found ${quoted.length}`);
}

// 2. Caregiver sharing: the help chat must not promise it while the site says it is coming later.
const sharingLater = /Sharing with siblings and caregivers: coming later/i.test(siteText);
if (sharingLater && /Family plan is for sharing|shared with (siblings|caregivers)/i.test(help)) {
  problems.push("Help chat says the Family plan shares with siblings or caregivers, but the site says sharing is coming later");
}

// 3. Plain safety lines that every built-in answer set relies on.
for (const required of ["I can't suggest medicines, supplements or doses", "In an emergency call 911"]) {
  if (!help.includes(required)) problems.push(`help.js no longer contains: "${required}"`);
}

if (problems.length) {
  console.error(`Help answers check failed (${problems.length}):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log("Help answers check passed: button names exist on the site and no unreleased feature is promised.");
