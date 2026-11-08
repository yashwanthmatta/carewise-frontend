// Rules 2026-10-20.7. A photo can drop the decimal point from a printed range as well as from the
// result ("Magnesium 1.9 mg/dL 1.6-2.3" read as "... 16-23", which showed a normal result as low;
// "Protein, Total 9.4 g/dL 6.0-8.5" read as "94 ... 6.0-85", which hid a misread 94). Such lines
// are asked about, never assumed, and confirming the suggestion fixes the line. Lines that were
// read correctly are not asked about. Found 2026-11-05 with the synthetic photo stress test.
// Rules 2026-10-20.8 add two more: a range that lost both decimals of a two-decimal result
// ("RBC 5.97 x10E6/uL 4.14-5.80" read as "414-580", which showed a high result as low) and a range
// that lost its dash ("Uric Acid 3.4 mg/dL 2.5-7.0" read as "257.0", which left the result with no range).
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
  // The result and its range both lost the point: the range is ten times the usual one.
  ["Lymphocytes 48H x10^9/L 15-40", "4.8H x10^9/L 1.5-4.0"],
  ["Neutrophils 15 x10M9/L 20-75", "1.5 x10M9/L 2.0-7.5"],
  ["HbA1c 44 % 40-56", "4.4 % 4.0-5.6"],
  ["Glucose 48 mmol/L 39-55", "4.8 mmol/L 3.9-5.5"],
  // Rules .8: both decimals of a two-decimal range lost.
  ["RBC 5.97 x10E6/uL 414-580 EN", "5.97 x10E6/uL 4.14-5.80"],
  ["RBC 4,79 x10E6/uL 414-580", "4,79 x10E6/uL 4,14-5,80"],
  // Rules .8: the dash between the two ends of the range lost.
  ["Uric Acid 3.4 mg/dL 257.0", "2.5-7.0"],
  ["Lymphocytes 2.5 x10^9/L 154.0", "1.5-4.0"],
  ["Urea 6.0 mmol/L 2578", "2.5-7.8"],
  ["Lymphocytes 4.6 H x10^9/L 1540 EN", "1.5-4.0"],
  ["INR 0.9 0.81.2 EN", "0.8-1.2"],
  ["AST 21 U/L 1035", "10-35"],
  ["Glucose 105 mg/dL 7099", "70-99"],
  // Read correctly: never asked.
  ["RBC 4.79 x10E6/uL 4.14-5.80", null],
  ["MCV 88 fL 79-97", null],
  ["eGFR 41 mL/min/1.73m2", null],
  ["Platelets 250 x10^3/uL", null],
  ["Glucose 105 98 01/02/2026 mg/dL", null],
  ["Cholesterol 210 198 mg/dL", null],
  ["Glucose 105 mg/dL 2026", null],
  ["Lymphocytes 30 % 20-40", null],
  ["Lymphocytes 2.1 x10^9/L 1.0-4.0", null],
  ["Glucose 95 mg/dL 70-99 (fasting)", null],
  ["HbA1c 42 mmol/mol 20-42", null],
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
  const { text, checks } = await page.evaluate((text) => checkOcrNumbers(`Sample Lab\n${text}`), line);
  const ask = checks.find((check) => check.line === 1 && check.kind === "ask");
  // Tests with their own photo rule (A1C among them) fix an impossible number and say so instead.
  const fixed = checks.find((check) => check.line === 1 && check.kind === "fixed");
  const ok = expected === null ? !ask && !fixed : ask?.other === expected || (!ask && fixed && text.split("\n")[1].endsWith(expected));
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${line} -> ${ask ? `asks "${ask.read}" or "${ask.other}"` : fixed ? `fixed and shown: "${text.split("\n")[1]}"` : "no question"}`);
}

// Two columns on one line: each test is checked on its own, and confirming fixes only its column.
{
  const line = "Creatinine 93 umol/L 59-104 Lymphocytes 2.5 x10^9/L 15-40";
  const { checks } = await page.evaluate((text) => checkOcrNumbers(`Sample Lab\n${text}`), line);
  const ask = checks.find((check) => check.line === 1 && check.kind === "ask");
  const ok = ask?.key === "lymphocytes" && ask.other === "2.5 x10^9/L 1.5-4.0" && ask.at > 0;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} two columns: ${ask ? `asks "${ask.read}" or "${ask.other}" at ${ask.at}` : "no question"}`);
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

// A result fixed by its own rule still gets the question about a range that lost its dash,
// and confirming it gives the line its range back.
{
  const { text, checks } = await page.evaluate(() => checkOcrNumbers("Sample Lab\nUric Acid 34 mg/dL 257.0"));
  const ask = checks.find((check) => check.kind === "ask");
  const ok = text.split("\n")[1] === "Uric Acid 3.4 mg/dL 257.0" && ask?.other === "2.5-7.0";
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} Uric Acid 34 mg/dL 257.0 -> fixed to 3.4 and asks about "${ask?.read}" or "${ask?.other}"`);
  await page.evaluate(() => showOcrResult("Sample Lab\nUric Acid 3.4 mg/dL 257.0\nSodium 140 mmol/L 135-145", "photo"));
  await page.waitForFunction(() => /Please check these numbers/.test(document.querySelector("#report-results")?.innerText || ""));
  await page.locator("#ocr-checks [data-ocr-suggested]").first().evaluate((el) => el.click());
  await page.waitForTimeout(300);
  const line = (await page.inputValue("#report-text")).split("\n")[1];
  const confirmOk = line === "Uric Acid 3.4 mg/dL 2.5-7.0";
  if (!confirmOk) failed += 1;
  console.log(`${confirmOk ? "ok  " : "FAIL"} confirming a range that lost its dash fixes the line ("${line}")`);
}

await browser.close();
if (failed) {
  console.log(`${failed} range decimal check(s) failed`);
  process.exit(1);
}
console.log("All range decimal checks passed");
