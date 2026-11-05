// Reminder calls follow the time zone of the person being reminded, not the device of whoever
// sets them up, and editing a reminder never changes its saved zone.
// Usage: serve the site on :4173, then
//   node scripts/eval/reminder-timezone.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const browser = await chromium.launch();
// The caregiver's device is in London; the parent lives in Denver.
const context = await browser.newContext({ timezoneId: "Europe/London", viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto(`${base}#reminders`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.carewiseReminderForm && typeof apiPost === "function");
// Capture what would be sent to the API; no network calls are made.
await page.evaluate(() => {
  window.sentReminders = [];
  window.apiPost = async (path, body) => { window.sentReminders.push({ method: "POST", path, body }); return {}; };
  window.apiPut = async (path, body) => { window.sentReminders.push({ method: "PUT", path, body }); return {}; };
  window.apiGet = async () => [];
});

const choices = await page.evaluate(() => window.carewiseReminderForm.zoneChoices("America/Denver").map((c) => c.value));
ok(choices.includes("America/New_York") && choices.includes("Pacific/Honolulu"), "the list offers the US time zones");
ok(choices.includes("Europe/London"), "the device's own zone is offered when it is not a US zone");
ok(new Set(choices).size === choices.length, "no zone is listed twice");

// New reminder: defaults to the device zone; the caregiver picks the parent's zone.
await page.evaluate(() => window.carewiseReminderForm.openForm());
ok(await page.inputValue("#rm-timezone") === "Europe/London", "a new reminder starts with the device's zone");
// The reminders view may be hidden in this test page, so set the fields directly.
await page.evaluate(() => {
  document.getElementById("rm-timezone").value = "America/Denver";
  document.getElementById("rm-label").value = "Morning tablets";
});
await page.evaluate(() => document.getElementById("rm-form").requestSubmit());
await page.waitForFunction(() => window.sentReminders.length === 1);
let sent = await page.evaluate(() => window.sentReminders[0]);
ok(sent.method === "POST" && sent.body.timezone === "America/Denver", "the chosen zone (Denver), not the device zone, is sent");

// Editing a saved reminder keeps its zone even though the device is elsewhere.
await page.evaluate(() => window.carewiseReminderForm.openForm({ id: "r1", person: "Dad", label: "Evening", times: ["20:00"], days: ["mon"], timezone: "America/Phoenix", language: "en" }));
ok(await page.inputValue("#rm-timezone") === "America/Phoenix", "editing shows the saved zone");
await page.evaluate(() => document.getElementById("rm-form").requestSubmit());
await page.waitForFunction(() => window.sentReminders.length === 2);
sent = await page.evaluate(() => window.sentReminders[1]);
ok(sent.method === "PUT" && sent.body.timezone === "America/Phoenix", "saving an edit keeps the saved zone");

// A saved zone outside the list is kept and shown, not replaced.
await page.evaluate(() => window.carewiseReminderForm.openForm({ id: "r2", person: "Mum", times: ["09:00"], days: ["tue"], timezone: "Asia/Kolkata", language: "en" }));
ok(await page.inputValue("#rm-timezone") === "Asia/Kolkata", "an unlisted saved zone (Asia/Kolkata) is kept");

const label = await page.textContent("label.rm-zone");
ok(/Their time zone/.test(label) && /where the person lives/.test(label), "the field explains whose clock the times follow");

await browser.close();
if (failures) { console.error(`${failures} reminder time zone check(s) failed`); process.exit(1); }
console.log("All reminder time zone checks passed");
