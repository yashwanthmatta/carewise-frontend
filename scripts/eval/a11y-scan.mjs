// Accessibility scan of the whole site with axe-core (WCAG 2.0, 2.1 and 2.2, levels A and AA).
// Covers every screen of the app (Home, Upload, a synthetic sample report with all results open,
// History, Record, Account signed out) and every static page, on a phone and a desktop.
// Fails on "serious" or "critical" violations; "moderate" and "minor" ones are listed as warnings.
// An automated scan finds only part of what matters: it does not replace testing with a screen
// reader, keyboard-only use or zoom (see docs/accessibility-device-checklist.md if present).
// Synthetic data only; no network calls leave the machine (fonts, CDNs and the API are blocked).
// Usage: serve the site on :4173, then AXE_PATH=/path/to/axe.min.js node scripts/eval/a11y-scan.mjs
//   A11Y_JSON=out.json also writes every finding to a file.
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
const axePath = process.env.AXE_PATH;
if (!axePath || !fs.existsSync(axePath)) {
  console.error("Set AXE_PATH to axe.min.js (npm install --no-save axe-core@4.14.0, then node_modules/axe-core/axe.min.js).");
  process.exit(2);
}
const axeSource = fs.readFileSync(axePath, "utf8");
const BLOCKING = new Set(["serious", "critical"]);

const REPORT = [
  "Sample Lab",
  "Hemoglobin 11.2 L g/dL 12.0-15.5",
  "Creatinine 2.3 H mg/dL 0.6-1.3",
  "eGFR 28 L mL/min/1.73m2 >=60",
  "Potassium 4.9 mmol/L 3.5-5.1",
  "TSH 2.0 mIU/L 0.4-4.0",
].join("\n");

const appScreens = [
  { name: "Home", hash: "app-title" },
  { name: "Upload", hash: "report-title" },
  {
    name: "Sample report (results open)",
    hash: "report-title",
    prepare: async (page) => {
      await page.fill("#report-text", REPORT);
      await page.click("#analyze-report");
      await page.waitForSelector("#report-results .lab-panel", { state: "attached", timeout: 15000 });
      await page.evaluate(() => { document.querySelectorAll("#report-results details").forEach((node) => { node.open = true; }); });
    },
  },
  { name: "History", hash: "saved-title" },
  { name: "Record", hash: "record-title" },
  { name: "Account (signed out)", hash: "account-title" },
];
const pages = fs.readdirSync(".").filter((f) => f.endsWith(".html") && f !== "index.html")
  .concat(fs.existsSync("legal") ? fs.readdirSync("legal").filter((f) => f.endsWith(".html")).map((f) => `legal/${f}`) : [])
  .sort();

const browser = await chromium.launch();
const findings = [];
let blocking = 0;
let warnings = 0;

async function scan(label, size, url, prepare) {
  const viewport = size === "phone" ? { width: 375, height: 740 } : { width: 1280, height: 900 };
  // bypassCSP lets the axe script run; the site's own CSP is checked separately by csp-check.mjs.
  const context = await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: true, reducedMotion: "reduce" });
  await context.route(/fonts\.googleapis|fonts\.gstatic|jsdelivr|unpkg|cdnjs|onrender\.com/, (route) => route.abort());
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(400);
    if (prepare) await prepare(page);
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(async () => {
      const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" ")), count: v.nodes.length }));
    });
    const bad = result.filter((v) => BLOCKING.has(v.impact));
    const soft = result.filter((v) => !BLOCKING.has(v.impact));
    blocking += bad.length;
    warnings += soft.length;
    for (const v of result) findings.push({ screen: label, size, ...v });
    console.log(`${bad.length ? "FAIL" : "ok  "} ${size.padEnd(7)} ${label}${bad.length ? `: ${bad.map((v) => `${v.id} [${v.impact}] x${v.count}`).join(", ")}` : ""}`);
    for (const v of bad) console.log(`       ${v.help}: ${v.nodes.join(" | ")}`);
    if (soft.length) console.log(`       warning: ${soft.map((v) => `${v.id} [${v.impact}] x${v.count}`).join(", ")}`);
  } catch (error) {
    blocking += 1;
    console.log(`FAIL ${size.padEnd(7)} ${label}: could not scan (${error.message.split("\n")[0]})`);
  } finally {
    await context.close();
  }
}

for (const size of ["phone", "desktop"]) {
  for (const screen of appScreens) await scan(screen.name, size, `${base}#${screen.hash}`, screen.prepare);
  for (const file of pages) await scan(file, size, `${base}${file}`);
}
await browser.close();

if (process.env.A11Y_JSON) fs.writeFileSync(process.env.A11Y_JSON, JSON.stringify(findings, null, 2));
const screens = (appScreens.length + pages.length) * 2;
console.log(`\nScanned ${screens} screen/size combinations with axe-core. Serious or critical: ${blocking}. Moderate or minor (warnings): ${warnings}.`);
console.log(blocking ? "Accessibility scan FAILED" : "Accessibility scan passed (no serious or critical violations)");
process.exit(blocking ? 1 : 0);
