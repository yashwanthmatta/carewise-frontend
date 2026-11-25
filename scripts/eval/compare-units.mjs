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

await browser.close();
if (failed) { console.log(`${failed} comparison check(s) failed`); process.exit(1); }
console.log("All comparison unit checks passed");
