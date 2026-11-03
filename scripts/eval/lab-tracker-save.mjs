// Saving a report's values to the lab tracker: each value is dated by the test (from the report
// when it says so unambiguously, otherwise the person enters it), the same result is never saved
// twice, and the tracker no longer drops older values after 60.
// Usage: serve the site on :4173, then node scripts/eval/lab-tracker-save.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
await context.route(/carewise-api\.onrender\.com/, (route) => route.fulfill({ status: 503, body: "{}", contentType: "application/json" }));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const explain = async (text) => {
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", text);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { timeout: 15000 });
};
const save = async () => { await page.click('#report-results [data-report-action="save-detected-values"]'); await page.waitForTimeout(400); };
const trends = () => page.evaluate(() => getLabTrends());

// The date is read from the report, by function, for the formats labs use.
const dates = await page.goto(base).then(() => page.evaluate(() => [
  reportTestDate("Collected: 2025-03-14 08:12"),
  reportTestDate("Specimen collected 14 Mar 2025"),
  reportTestDate("Date collected: March 14, 2025"),
  reportTestDate("Collected 14/03/2025"),
  reportTestDate("Collected 03/14/2025"),
  reportTestDate("Collected 03/04/2025"),
  reportTestDate("Collected 31/02/2025"),
  reportTestDate("LDL 148 mg/dL <100"),
  reportTestDate("Reported 2025-03-20\nCollected 2025-03-14"),
]));
ok(JSON.stringify(dates) === JSON.stringify(["2025-03-14", "2025-03-14", "2025-03-14", "2025-03-14", "2025-03-14", "", "", "", "2025-03-14"]),
  `test dates: ISO, day-month, month-day, unambiguous slashes; ambiguous or impossible dates left blank; collected beats reported (${dates.join(",")})`);

// 1. A report with a collection date: values are dated by it, not today.
await explain("Sample Lab\nCollected: 2025-03-14\nLDL cholesterol 148 mg/dL <100\nA1C 5.4 % 4.0-5.6");
ok((await page.inputValue("[data-trend-date]")) === "2025-03-14", "the test date is filled in from the report");
await save();
let saved = await trends();
ok(saved.length === 2 && saved.every((item) => item.date === "2025-03-14"), `values are saved with the test date (${saved.map((item) => item.date).join(",")})`);
ok(saved.some((item) => item.test.match(/LDL/i) && item.value === "148" && item.unit === "mg/dL"), "the value and unit are saved exactly");

// 2. Saving again adds nothing.
await save();
saved = await trends();
ok(saved.length === 2, "saving the same report again adds no duplicates");
ok(/already in your lab tracker/.test(await page.textContent("#report-status")), "it says the values were already there");

// 3. No date on the report: the person is asked for it, and nothing is saved until then.
await explain("Sample Lab\nLDL cholesterol 131 mg/dL <100\nA1C 6.1 % 4.0-5.6");
ok((await page.inputValue("[data-trend-date]")) === "", "with no date on the report, the field starts empty");
await save();
ok((await trends()).length === 2, "nothing is saved without a test date");
ok(/Enter the date of the test/.test(await page.textContent("#report-status")), "it asks for the date of the test");
ok(await page.evaluate(() => document.activeElement?.matches("[data-trend-date]")), "focus moves to the date field");
await page.fill("[data-trend-date]", "2024-11-02");
await save();
saved = await trends();
ok(saved.length === 4 && saved.some((item) => item.value === "131" && item.date === "2024-11-02"), "after entering a date, the values are saved with it");

// 4. More than 60 values are kept (the old limit dropped them silently).
const kept = await page.evaluate(() => {
  for (let i = 0; i < 80; i += 1) addLabTrendEntry({ id: `x${i}`, test: "Synthetic", value: String(i), unit: "u", date: "2024-01-01" });
  return getLabTrends().length;
});
ok(kept === 84, `older values are no longer dropped after 60 (${kept} kept)`);

ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
await browser.close();
if (failures) { console.error(`${failures} lab tracker check(s) failed`); process.exit(1); }
console.log("All lab tracker checks passed");
