// Report results (editorial pass, 2026-11-09): "All tests on your report" is grouped by body area,
// with filters for all results, results outside the lab's range, and each area. Grouping and
// filtering only change what is shown: every result, value, range and label stays the same.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the results.
// Usage: serve the site on :4173, then node scripts/eval/results-groups.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const REPORT = [
  "Sample Lab",
  "Hemoglobin 11.2 L g/dL 12.0-15.5",
  "Platelets 250 x10^3/uL 150-450",
  "Creatinine 2.3 H mg/dL 0.6-1.3",
  "eGFR 28 L mL/min/1.73m2 >=60",
  "Potassium 4.9 mmol/L 3.5-5.1",
  "Sodium 139 mmol/L 135-145",
  "TSH 2.0 mIU/L 0.4-4.0",
  "ALT 22 U/L 7-56",
  "PSA total 0.8 ng/mL 0.0-4.0",
].join("\n");

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", REPORT);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .lab-panel", { state: "attached", timeout: 15000 });
  // "All tests" folds away under the summary: open it the way a person would.
  await page.evaluate(() => { for (let node = document.querySelector("#report-results .lab-panel"); node; node = node.parentElement) if (node.tagName === "DETAILS") node.open = true; });

  const rows = () => page.evaluate(() => [...document.querySelectorAll("#report-results .lab-panel-row[data-test-area]")]
    .filter((row) => !row.hidden && !row.closest("[hidden]")).map((row) => row.innerText.replace(/\s+/g, " ").trim()));
  const expected = await page.evaluate((text) => buildReportView(analyzeReportTextLocally(text), "en").tests.map((t) => [t.name, t.value, t.range, t.label]), REPORT);
  const all = await rows();
  check(all.length === expected.length && expected.every(([name, value, range, label]) => all.some((row) => row.includes(name) && row.includes(value) && row.includes(range) && row.includes(label))), `${size}: all ${expected.length} results shown with their exact value, range and label`);
  const groups = await page.$$eval("#report-results .lab-panel-group-head", (heads) => heads.map((head) => head.innerText.trim()));
  check(groups.includes("Kidneys") && groups.includes("Blood count and clotting") && groups.includes("Other tests"), `${size}: grouped by area (${groups.join(", ")})`);

  await page.click('#report-results [data-test-filter="outside"]');
  const outside = await rows();
  check(outside.length === 3 && outside.every((row) => /Hemoglobin|Creatinine|eGFR/.test(row)), `${size}: "Outside the lab's range" shows the 3 results outside it`);
  check(await page.getAttribute('#report-results [data-test-filter="outside"]', "aria-pressed") === "true", `${size}: the chosen filter is marked as pressed`);
  check(/Showing 3 results/.test(await page.innerText("#report-results [data-test-filter-status]")), `${size}: screen readers hear how many are shown`);

  await page.click('#report-results [data-test-filter="kidneys"]');
  const kidneys = await rows();
  check(kidneys.length === 2 && kidneys.every((row) => /Creatinine|eGFR/.test(row)), `${size}: Kidneys shows creatinine and eGFR`);
  const hiddenGroups = await page.$$eval("#report-results [data-test-group]", (list) => list.filter((group) => !group.hidden).map((group) => group.dataset.testGroup));
  check(JSON.stringify(hiddenGroups) === '["kidneys"]', `${size}: other group headings are hidden`);

  await page.click('#report-results [data-test-filter="all"]');
  check((await rows()).length === expected.length, `${size}: "All" shows every result again`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);

  if (process.env.AXE_PATH) {
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [["#report-results"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
  await context.close();
}

// A short report stays one plain list, with no filters.
{
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", "Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3\nPotassium 4.9 mmol/L 3.5-5.1");
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .lab-panel", { state: "attached", timeout: 15000 });
  check(!(await page.$("#report-results .lab-filters")) && (await page.$$("#report-results .lab-panel-row[data-test-area]")).length === 2, "short report: one list, no filters");
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} results grouping check(s) failed`); process.exit(1); }
console.log("All results grouping checks passed");
