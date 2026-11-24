// Core-workflow usage counts (22 Nov 2026). The founder needs to see whether people get from the
// homepage to an explained report, its source line, the doctor questions and a reminder. This checks:
// - each step sends one anonymous count, by name only ({ name, source }), never report content;
// - every name the site sends is one the API accepts (backend USAGE_EVENTS; keep KNOWN in step);
// - nothing is sent with Do Not Track on.
// Usage: serve the site on :4173, then node scripts/eval/usage-events.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
// Mirror of the backend allow-list (app/schemas/carewise.py USAGE_EVENTS).
const KNOWN = new Set([
  "report_explained", "sample_opened", "demo_started", "demo_finished", "pdf_read", "photo_read",
  "doctor_brief_opened", "spanish_used", "early_access_opened", "listen_used", "share_packet_pdf",
  "home_viewed", "upload_started", "value_corrected", "source_line_viewed", "report_saved",
  "questions_copied", "reminder_created", "returning_visit", "plan_interest",
  "value_confirmed", "value_mismatch",
]);
const REPORT = "Sample Lab\nLDL cholesterol 162 H mg/dL 0-99\nGlucose 92 mg/dL 70-99\nPotassium 4.2 mmol/L 3.5-5.1";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
async function session({ doNotTrack = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
  const sent = [];
  // Routes added later win, so the event route goes last to beat the block on the live API host.
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await context.route("**/product/events", async (route) => {
    sent.push(JSON.parse(route.request().postData() || "{}"));
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"accepted":true}' });
  });
  await context.addInitScript((dnt) => {
    localStorage.setItem("carewiseTrackLocal", "1");
    localStorage.setItem("carewiseTrackAutomation", "1");
    if (dnt) Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" });
  }, doNotTrack);
  const page = await context.newPage();
  return { context, page, sent };
}
const names = (sent) => sent.map((event) => event.name);
const settle = (page) => page.waitForTimeout(400);

const { context, page, sent } = await session();
await page.goto(base, { waitUntil: "load" });
await settle(page);
check(names(sent).includes("home_viewed"), `opening the homepage counts home_viewed (${names(sent).join(", ")})`);
check(!names(sent).includes("returning_visit"), "a first visit is not a returning visit");

await page.evaluate(() => localStorage.setItem("ftLastVisitDay", "2000-01-01"));
await page.reload({ waitUntil: "load" });
await settle(page);
check(names(sent).includes("returning_visit"), "a visit on a later day counts returning_visit");
const visitsBefore = names(sent).filter((n) => n === "returning_visit").length;
await page.reload({ waitUntil: "load" });
await settle(page);
check(names(sent).filter((n) => n === "returning_visit").length === visitsBefore, "a second visit on the same day is not counted again");

await page.goto(`${base}#report-title`, { waitUntil: "load" });
await page.fill("#report-text", REPORT);
await page.click("#analyze-report");
await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
await settle(page);
check(names(sent).includes("upload_started") && names(sent).includes("report_explained"), "explaining a report counts upload_started and report_explained");

await page.evaluate(() => {
  const details = [...document.querySelectorAll("#report-results details.result-card-more")].find((d) => d.querySelector(".result-card-source"));
  details.open = true;
});
await settle(page);
check(names(sent).includes("source_line_viewed"), "opening a result's report line counts source_line_viewed");

await page.locator('[data-report-action="copy-questions"]').first().click();
await settle(page);
check(names(sent).includes("questions_copied"), "copying the doctor questions counts questions_copied");

check(sent.every((event) => Object.keys(event).sort().join(",") === "name,source"), "every count carries only a name and a source");
const body = JSON.stringify(sent);
check(!/LDL|162|Glucose|mg\/dL|Potassium/.test(body), "no report content is sent");
const unknown = [...new Set(names(sent))].filter((name) => !KNOWN.has(name));
check(!unknown.length, `every name sent is one the API accepts ${unknown.join(", ")}`);
await context.close();

// Every name used anywhere in the site's scripts is accepted by the API.
const fs = await import("node:fs");
const used = new Set();
for (const file of fs.readdirSync(".").filter((f) => f.endsWith(".js"))) {
  for (const match of fs.readFileSync(file, "utf8").matchAll(/(?:trackReportUsage|trackUsage)\("([a-z_]+)"\)/g)) used.add(match[1]);
}
const notAccepted = [...used].filter((name) => !KNOWN.has(name));
check(!notAccepted.length, `every event name in the site's scripts is on the API's list ${notAccepted.join(", ")}`);

// Automated browsers (like our scheduled monitors) are never counted unless a test asks for it.
{
  const bot = await session();
  await bot.context.addInitScript(() => localStorage.removeItem("carewiseTrackAutomation"));
  await bot.page.goto(base, { waitUntil: "load" });
  await bot.page.evaluate(() => localStorage.removeItem("carewiseTrackAutomation"));
  bot.sent.length = 0;
  await bot.page.reload({ waitUntil: "load" });
  await settle(bot.page);
  check(await bot.page.evaluate(() => navigator.webdriver) === true && bot.sent.length === 0, "an automated browser (navigator.webdriver) is not counted");
  await bot.context.close();
}

const dnt = await session({ doNotTrack: true });
await dnt.page.goto(base, { waitUntil: "load" });
await settle(dnt.page);
check(dnt.sent.length === 0, "nothing is sent with Do Not Track on");
await dnt.context.close();

await browser.close();
if (failed) { console.log(`${failed} usage event check(s) failed`); process.exit(1); }
console.log("All usage event checks passed");
