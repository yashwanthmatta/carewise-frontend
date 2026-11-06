// Rules 2026-10-20.7. A photo can drop the decimal point from a printed range as well as from the
// result ("Magnesium 1.9 mg/dL 1.6-2.3" read as "... 16-23", which showed a normal result as low;
// "Protein, Total 9.4 g/dL 6.0-8.5" read as "94 ... 6.0-85", which hid a misread 94). Such lines
// are asked about, never assumed, and confirming the suggestion fixes the line. Lines that were
// read correctly are not asked about. Found 2026-11-05 with the synthetic photo stress test.
// Usage: serve the site on :4173, then node scripts/eval/ocr-range-decimals.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// [photo line as read, the suggestion the person should be offered, or null for "do not ask"]
const CASES = [
  ["Lymphocytes 2.5 x10^9/L 15-40", "2.5 x10^9/L 1.5-4.0"],
  ["Neutrophils 8.6 x10^9/L 20-75", "8.6 x10^9/L 2.0-7.5"],
  ["Urea 8.2 mmol/L 25-78", "8.2 mmol/L 2.5-7.8"],
  ["Neutrophils 9,3 x10^9/L 2,0-75", "9,3 x10^9/L 2,0-7,5"],
  ["Protein, Total 94H g/dL 6.0-85", "9.4H g/dL 6.0-8.5"],
  ["Prothrombin Time 105 sec 9.4-125", "10.5 sec 9.4-12.5"],
  // Read correctly: never asked.
  ["Hemoglobin 13.5 g/dL 12-16", null],
  ["Hematocrit 40.8 % 37.5-51.0", null],
  ["Glucose 95 mg/dL 70-99", null],
  ["WBC 6.2 x10^3/uL 4.0-11", null],
  ["C-Reactive Protein 0.5 mg/L 0.0-10", null],
  ["Albumin 39 g/L 35-50", null],
  ["Sodium 140 mmol/L 135-145", null],
  ["PSA total 0,1 ng/mL 0,0-4,0", null],
];

const browser = await chromium.launch();
const page = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof checkOcrNumbers === "function");
let failed = 0;
for (const [line, expected] of CASES) {
  const { checks } = await page.evaluate((text) => checkOcrNumbers(`Sample Lab\n${text}`), line);
  const ask = checks.find((check) => check.line === 1 && check.kind === "ask");
  const ok = expected === null ? !ask : ask?.other === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${line} -> ${ask ? `asks "${ask.read}" or "${ask.other}"` : "no question"}`);
}

// Tests with their own photo rules (magnesium among them) already put the range's point back.
const magnesium = await page.evaluate(() => checkOcrNumbers("Sample Lab\nMagnesium 1.9 mg/dL 16-23").text.split("\n")[1]);
const magnesiumOk = magnesium === "Magnesium 1.9 mg/dL 1.6-2.3";
if (!magnesiumOk) failed += 1;
console.log(`${magnesiumOk ? "ok  " : "FAIL"} Magnesium 1.9 mg/dL 16-23 -> "${magnesium}"`);

// Confirming the suggestion fixes the line, and the result is then read against the right range.
await page.evaluate(() => showOcrResult("Sample Lab\nLymphocytes 2.5 x10^9/L 15-40\nSodium 140 mmol/L 135-145", "photo"));
await page.waitForFunction(() => /Please check these numbers/.test(document.querySelector("#report-results")?.innerText || ""));
const askedFirst = /still to confirm/.test(await page.innerText("#report-results"));
await page.locator("#ocr-checks [data-ocr-suggested]").first().evaluate((el) => el.click());
await page.waitForTimeout(300);
const fixedLine = (await page.inputValue("#report-text")).split("\n")[1];
const after = await page.innerText("#report-results");
const fixedOk = askedFirst && fixedLine === "Lymphocytes 2.5 x10^9/L 1.5-4.0" && !/still to confirm/.test(after);
if (!fixedOk) failed += 1;
console.log(`${fixedOk ? "ok  " : "FAIL"} confirming the suggestion fixes the line ("${fixedLine}") and clears the question`);

await browser.close();
if (failed) {
  console.log(`${failed} range decimal check(s) failed`);
  process.exit(1);
}
console.log("All range decimal checks passed");
