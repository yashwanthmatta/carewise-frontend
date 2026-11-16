// Report formats seen on real lab printouts that were not covered by another eval (16 Nov). Each one
// was checked by hand and read correctly; this keeps it that way. It only checks that the value, unit
// and printed range are read as printed and land on the right side of the lab's own range. It does
// not test or change any medical rule. All reports are made up.
// Usage: serve the site on :4173, then node scripts/eval/report-edge-formats.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// [name, report text, expected rows: [name pattern, value, range, status]]
const CASES = [
  ["decimal commas", "Sample Lab\nHemoglobin 13,5 g/dL 12,0-15,5\nPotassium 4,9 mmol/L 3,5-5,1",
    [[/^Hemoglobin/, "13.5 g/dL", "12.0-15.5", "within"], [/^Potassium/, "4.9 mmol/L", "3.5-5.1", "within"]]],
  ["values below the detection limit", "Sample Lab\nCRP <0.5 mg/L 0.0-5.0\nTroponin <0.01 ng/mL <0.04",
    [[/^CRP/, "<0.5 mg/L", "0.0-5.0", "within"], [/^Troponin/, "<0.01 ng/mL", "<0.04", "within"]]],
  ["flag glued to the number", "Sample Lab\nSodium 128L mmol/L 135-145\nGlucose 210H mg/dL 70-99",
    [[/^Sodium/, "128 mmol/L", "135-145", "below"], [/^Glucose/, "210 mg/dL", "70-99", "above"]]],
  ["thousands separator", "Sample Lab\nPlatelets 1,250 x10^3/uL 150-400\nWBC 12.3 x10^3/uL 4.0-11.0",
    [[/^Platelets/, "1250 x10^3/uL", "150-400", "above"], [/^White blood cells/, "12.3 x10^3/uL", "4.0-11.0", "above"]]],
  ["a previous-result column is not the result", "Sample Lab\nTest Result Previous Range\nCreatinine 1.4 1.1 0.6-1.3 mg/dL",
    [[/^Creatinine/, "1.4 mg/dL", "0.6-1.3", "above"]]],
];

let failed = 0;
const browser = await chromium.launch();
for (const [name, text, expected] of CASES) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route(/onrender|fonts\.|jsdelivr/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", text);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  const rows = await page.evaluate(() => JSON.parse(localStorage.getItem("carewiseReports") || "[]")[0]?.results || []);
  const problems = expected.flatMap(([pattern, value, range, status]) => {
    const row = rows.find((r) => pattern.test(r.name));
    if (!row) return [`${pattern} not read`];
    const got = `${row.value} [${row.range}] ${row.status}`;
    return got === `${value} [${range}] ${status}` ? [] : [`${row.name}: got ${got}, expected ${value} [${range}] ${status}`];
  });
  if (problems.length) failed += 1;
  console.log(`${problems.length ? "FAIL" : "ok  "} ${name}${problems.length ? `: ${problems.join("; ")}` : ""}`);
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} report format case(s) failed`); process.exit(1); }
console.log(`All ${CASES.length} report format cases passed`);
