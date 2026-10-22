// A test name in a heading or a list ("Lipid panel and A1C", "Tests: lipids, A1C") must never
// take its value from a different test on a later line. Found on 2026-10-22: the A1C reader read
// "Total cholesterol 228" as an A1C of 228% ("diabetes range"). Usage: serve the site on :4173,
// then node scripts/eval/heading-values.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// [report text, label, expected value (null = must not be found)]
const CASES = [
  ["Lipid panel and A1C\n\nTotal cholesterol 228 mg/dL <200 H\nHemoglobin A1c 5.9 % 4.0-5.6 H", "A1C", 5.9],
  ["Lipid panel and A1C\nTotal cholesterol 228 mg/dL <200 H", "A1C", null],
  ["Tests: lipids, A1C, TSH\nLDL 130 mg/dL", "A1C", null],
  ["Tests ordered: LDL, vitamin D\nTSH 2.1 mIU/L 0.4-4.5", "LDL cholesterol", null],
  ["Tests ordered: LDL, vitamin D\nTSH 2.1 mIU/L 0.4-4.5", "Vitamin D", null],
  ["Cholesterol and triglycerides panel\nHDL 52 mg/dL >40", "Triglycerides", null],
  // A value on the next line, directly under its own name, is still read.
  ["A1C:\n7.2 %", "A1C", 7.2],
  ["HbA1c\n44 mmol/mol", "A1C", 6.2],
  ["LDL cholesterol\n142 mg/dL", "LDL cholesterol", 142],
];

const browser = await chromium.launch();
const page = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof analyzeReportTextLocally === "function");
let failed = 0;
for (const [text, label, expected] of CASES) {
  const found = await page.evaluate(([t, l]) => (analyzeReportTextLocally(t).labValues || []).find((item) => item.label === l)?.value ?? null, [text, label]);
  const ok = found === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${JSON.stringify(text)} ${label} -> ${found} (expected ${expected})`);
}
await browser.close();
console.log(failed ? `${failed} check(s) FAILED` : "All heading checks passed");
process.exit(failed ? 1 : 0);
