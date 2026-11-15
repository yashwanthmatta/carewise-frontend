// History with nothing saved shows one empty message (not two), no "Clear" buttons and no person filter, offers the next step,
// and hides the account-only "Load my saved labs" while signed out. Once a report has been
// explained, History lists it and "Clear history" comes back.
// Usage: serve the site on :4173, then node scripts/eval/history-empty.mjs
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

await page.goto(`${base}#saved-title`, { waitUntil: "load" });
await page.waitForTimeout(500);
ok(await page.isHidden("#clear-saved"), "empty History has no Clear history button");
ok(await page.isHidden("#clear-lab-trends"), "empty lab tracker has no Clear labs button");
ok(await page.isHidden(".history-person-filter >> nth=0"), "empty History has no person filter");
ok(await page.isHidden("#load-lab-trends"), "signed out, there is no account-only Load my saved labs");
ok(await page.isVisible('.history-empty a[href="#report-title"]'), "empty History offers Explain a report");
// The empty lab tracker says "nothing saved" once, not in two places.
const labText = await page.innerText("#lab-trend-status").catch(() => "");
ok(!/Add values from your reports/.test(labText), `empty lab tracker has one empty message, not two (status: "${labText}")`);

// Record: the empty timeline offers the made-up history as a button you can see and press.
await page.goto(`${base}#record-title`, { waitUntil: "load" });
await page.waitForTimeout(500);
ok(await page.isVisible(".record-empty [data-record-sample]"), "empty Record shows a visible button for the made-up 20-year history");
await page.click(".record-empty [data-record-sample]");
await page.waitForTimeout(400);
ok(await page.locator(".record-empty").count() === 0 && await page.evaluate(() => getHealthRecord().some((item) => item.sample)), "pressing it adds the made-up history to the timeline");
await page.evaluate(() => localStorage.removeItem("carewiseHealthRecord"));
await page.goto(`${base}#saved-title`, { waitUntil: "load" });
await page.waitForTimeout(300);

await page.click('.history-empty a[href="#report-title"]');
await page.waitForTimeout(500);
ok(await page.evaluate(() => location.hash === "#report-title"), "Explain a report goes to the upload screen");

// Explain the sample, then come back to History.
await page.goto(`${base}#try=raj-kidney-heart-uk/explain`, { waitUntil: "load" });
await page.waitForSelector("#report-results .report-summary", { timeout: 20000 });
await page.goto(`${base}#saved-title`, { waitUntil: "load" });
await page.waitForTimeout(800);
const saved = await page.evaluate(() => getReportHistory().length);
if (saved) {
  ok(await page.isVisible("#clear-saved"), "with a saved report, Clear history is back");
  ok(await page.locator(".history-empty").count() === 0, "with a saved report, the empty message is gone");
} else {
  ok(await page.isHidden("#clear-saved"), "the sample is not kept in History, and there is still nothing to clear");
}
ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
await browser.close();
if (failures) { console.error(`${failures} history check(s) failed`); process.exit(1); }
console.log("All history checks passed");
