// "What changed since your last report" never compares numbers in different units (25 Nov 2026).
// Found: glucose 126 mg/dL then 7.2 mmol/L was shown as "126 → 7.2 mmol/L · improving", although
// 7.2 mmol/L is the higher value. Now different units are "not compared", each value keeps its own
// unit, and nothing is converted. Back in range / now outside still show, because they use each
// report's own lab range. Synthetic reports only.
// Usage: serve the site on :4173, then node scripts/eval/compare-units.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
const context = await browser.newContext({ serviceWorkers: "block" });
await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
const page = await context.newPage();
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof compareMarkers === "function" && typeof renderReportChanges === "function");

const run = (before, now) => page.evaluate(([b, n]) => {
  const rows = compareMarkers(b, n);
  const text = renderReportChanges({ _changes: { since: "2026-10-01", rows } }).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  return { rows, text };
}, [before, now]);
const g = (value, unit, out = true) => ({ name: "Glucose", value, unit, out, direction: "low-good" });

let r = await run([g("126", "mg/dL")], [g("7.2", "mmol/L")]);
check(r.rows[0].kind === "unitsDiffer", `different units are not called improving or worse (${r.rows[0].kind})`);
check(/126 mg\/dL → 7\.2 mmol\/L/.test(r.text), "each value keeps its own unit");
check(/different units, so the numbers are not compared/.test(r.text) && /1 not compared/.test(r.text) && /0 improved/.test(r.text), `the count and the line say "not compared" (${r.text.trim()})`);

r = await run([g("126", "mg/dL")], [g("110", "MG/DL")]);
check(r.rows[0].kind === "improving" && /126 → 110 MG\/DL/.test(r.text), "the same unit in different case is still compared");

r = await run([g("126", "mg/dL")], [g("5.0", "mmol/L", false)]);
check(r.rows[0].kind === "backIn", "back in range still shows across units (each report's own range)");
r = await run([g("90", "mg/dL", false)], [g("7.2", "mmol/L", true)]);
check(r.rows[0].kind === "newOut", "now outside still shows across units");

r = await run([g("126", "")], [g("7.2", "mmol/L")]);
check(r.rows[0].kind === "unitsDiffer", "a missing unit on one side is not assumed to match");

// End to end: two reports for the same person, explained one after the other.
await page.goto(`${base}#report-title`, { waitUntil: "load" });
await page.evaluate(() => localStorage.removeItem("carewiseReportSnapshots"));
const explain = async (text) => {
  await page.fill("#report-text", text);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  await page.waitForTimeout(300);
};
await explain("Sample Lab\nGlucose 126 H mg/dL 70-99\nPotassium 4.2 mmol/L 3.5-5.1");
await explain("Sample Lab\nGlucose 7.2 H mmol/L 3.9-5.5\nPotassium 4.4 mmol/L 3.5-5.1");
const changes = (await page.locator("#report-results .report-changes").innerText().catch(() => "")).replace(/\s+/g, " ");
check(/Glucose[^·]* 126 mg\/dL → 7\.2 mmol\/L · different units/.test(changes), `a real second report says the glucose units differ (${changes.slice(0, 200)})`);
check(!/Glucose[^·]*· improving/.test(changes), "glucose is not called improving");
check(/Potassium 4\.2 → 4\.4 mmol\/L/.test(changes), "a test in the same unit is still compared");

// The same comparison in what goes to the doctor (27 Nov 2026): the printable summary, the PDF and
// the shared link printed "126 → 7.2 mmol/L", dropping the earlier report's unit.
const out = await page.evaluate(() => {
  const brief = buildDoctorBriefHtml(latestReportAnalysis, "Me").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // PDF text escapes brackets as \( and \); drop the escapes before matching.
  const pdf = new TextDecoder("latin1").decode(buildSharePacketPdf(latestReportAnalysis, "Me")).replace(/\\([()])/g, "$1");
  return { brief, pdf };
});
check(/Glucose[^:]*: 126 mg\/dL → 7\.2 mmol\/L \(different units/.test(out.brief), "the doctor summary keeps each report's unit");
check(!/Glucose[^:]*: 126 → /.test(out.brief), "the doctor summary never shows 126 without its unit");
check(/Glucose[^:]*: 126 mg\/dL -> 7\.2 mmol\/L \(different units/.test(out.pdf), "the PDF keeps each report's unit");
check(/Potassium: 4\.2 -> 4\.4 mmol\/L/.test(out.pdf), "the PDF still shows one unit when both reports used it");

const { readFileSync } = await import("node:fs");
const shareSource = readFileSync(new URL("../../doctor-share.js", import.meta.url), "utf8");
check(/before_unit: r\.beforeUnit/.test(shareSource), "the shared-link snapshot carries the earlier unit");

// The doctor's view of a shared link, with a synthetic snapshot.
const shareRows = (rows) => ({ snapshot: { person: "Me", changes: { since: "2026-10-01", rows } } });
for (const [rows, want, label] of [
  [[{ name: "Glucose", before: "126", before_unit: "mg/dL", now: "7.2", unit: "mmol/L", label: "different units, so the numbers are not compared" }], /Glucose: 126 mg\/dL → 7\.2 mmol\/L \(different units/, "the shared link keeps each report's unit"],
  [[{ name: "Potassium", before: "4.2", before_unit: "mmol/L", now: "4.4", unit: "mmol/L", label: "no change" }], /Potassium: 4\.2 → 4\.4 mmol\/L/, "the shared link shows one unit when both match"],
  [[{ name: "Potassium", before: "4.2", now: "4.4", unit: "mmol/L", label: "no change" }], /Potassium: 4\.2 → 4\.4 mmol\/L/, "an older shared link without the earlier unit still reads"],
]) {
  const viewer = await context.newPage();
  await viewer.route(/onrender\.com\/shares\/view/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(shareRows(rows)) }));
  await viewer.goto(`${base}share.html#t=${"s".repeat(32)}`, { waitUntil: "load" });
  const text = await viewer.locator("body").innerText({ timeout: 10000 }).catch(() => "");
  check(want.test(text.replace(/\s+/g, " ")), label);
  await viewer.close();
}

const clinicSource = readFileSync(new URL("../../docbridge.js", import.meta.url), "utf8");
check(/c\.before_unit/.test(clinicSource), "the clinic visit summary shows the earlier unit when it differs");

await browser.close();
if (failed) { console.log(`${failed} comparison check(s) failed`); process.exit(1); }
console.log("All comparison unit checks passed");
