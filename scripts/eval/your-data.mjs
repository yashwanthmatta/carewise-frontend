// Account → Your data. Uses synthetic data in this browser and a mocked API only.
// Checks: device counts, account counts, the device download leaves out sign-in tokens,
// account activity uses only recorded events, and "Clear this device" really clears it.
// Usage: serve the site on :4173, then node scripts/eval/your-data.mjs
import { readFile } from "node:fs/promises";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const summary = { account: { id: "u-test", email: "synthetic@example.com", role: "patient" }, counts: { reports: 2, report_analyses: 1, medications: 0, care_plans: 0, consent_records: 1, subscriptions: 0 } };
const fullExport = {
  account: summary.account,
  audit_events: [
    { id: "a1", action: "user_login", resource_type: "user", resource_id: "u-test", created_at: "2026-10-01T10:00:00Z" },
    { id: "a2", action: "doctor_share_created", resource_type: "doctor_share", resource_id: "s1", created_at: "2026-10-03T10:00:00Z" },
    { id: "a3", action: "some_future_action", resource_type: "x", resource_id: "y", created_at: "2026-10-02T10:00:00Z" },
  ],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", acceptDownloads: true });
let exportCalls = 0;
await context.route(/carewise-api\.onrender\.com/, (route) => {
  const url = route.request().url();
  if (url.includes("/privacy/me/export-summary")) return route.fulfill({ status: 200, body: JSON.stringify(summary), contentType: "application/json" });
  if (url.includes("/privacy/me/export")) { exportCalls += 1; return route.fulfill({ status: 200, body: JSON.stringify(fullExport), contentType: "application/json" }); }
  return route.fulfill({ status: 503, body: "{}", contentType: "application/json" });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// Signed out, nothing saved.
await page.goto(`${base}#your-data`, { waitUntil: "load" });
await page.waitForTimeout(400);
ok((await page.textContent("#yd-device-list")).includes("Nothing is saved on this device yet"), "empty device says nothing is saved");
ok(await page.isHidden("#yd-download-account"), "signed out: no account download button");
ok(await page.isHidden("#delete-account"), "signed out: no Delete my account button");
ok(await page.isHidden("#yd-activity-details"), "signed out: no account activity");
ok(await page.isVisible("#yd-clear-device"), "Clear this device is always offered");

// Synthetic local data plus a fake sign-in token.
await page.evaluate(() => {
  localStorage.setItem("carewiseReports", JSON.stringify([{ id: "r1" }, { id: "r2" }]));
  localStorage.setItem("carewiseLabTrends", JSON.stringify([{ testName: "LDL", value: "120" }]));
  localStorage.setItem("carewiseAuthToken", "synthetic-token-do-not-export");
  localStorage.setItem("carewiseRefreshToken", "synthetic-refresh-do-not-export");
  localStorage.setItem("carewiseAuthEmail", "synthetic@example.com");
});
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(800);
const device = await page.textContent("#yd-device-list");
ok(device.includes("2 saved reports") && device.includes("1 lab tracker value"), `device counts are right (${device.trim().replace(/\s+/g, " ")})`);
const account = await page.textContent("#yd-account-list");
ok(account.includes("2 saved reports") && account.includes("1 report explanation") && !account.includes("medicine"), "account counts come from the summary, zeros left out");
ok(await page.isVisible("#yd-download-account"), "signed in: account download offered");
ok(await page.isVisible("#delete-account"), "signed in: Delete my account is in Your data");

// Device download leaves out tokens.
const [download] = await Promise.all([page.waitForEvent("download"), page.click("#yd-download-device")]);
const file = JSON.parse(await readFile(await download.path(), "utf8"));
ok(file.data.carewiseReports?.length === 2, "device download contains the saved reports");
ok(!("carewiseAuthToken" in file.data) && !("carewiseRefreshToken" in file.data), "device download leaves out sign-in tokens");
ok(!JSON.stringify(file).includes("do-not-export"), "no token text anywhere in the file");

// Account download.
const [accountDownload] = await Promise.all([page.waitForEvent("download"), page.click("#yd-download-account")]);
const accountFile = JSON.parse(await readFile(await accountDownload.path(), "utf8"));
ok(accountFile.account?.id === "u-test", "account download is the account export");

// Activity: only recorded events, newest first, unknown actions labelled plainly.
await page.click("#yd-activity-details summary");
await page.waitForTimeout(400);
const items = await page.$$eval("#yd-activity li", (lis) => lis.map((li) => li.textContent));
ok(items.length === 3, `three recorded events shown (${items.length})`);
ok(items[0]?.startsWith("Doctor link made") && items[1]?.startsWith("Other account activity") && items[2]?.startsWith("Signed in"), "newest first, plain labels");
ok(exportCalls === 1, `activity reused the export instead of fetching again (${exportCalls} call)`);

// Clear this device: cancel keeps data, accept removes it and signs out here.
page.once("dialog", (d) => d.dismiss());
await page.click("#yd-clear-device");
ok(await page.evaluate(() => localStorage.getItem("carewiseReports") !== null), "cancelling keeps the data");
page.once("dialog", (d) => d.accept());
await Promise.all([page.waitForEvent("load"), page.click("#yd-clear-device")]);
await page.waitForTimeout(500);
const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("carewise") && !["carewiseApiUrl"].includes(k)));
ok(left.every((k) => !["carewiseReports", "carewiseLabTrends", "carewiseAuthToken", "carewiseRefreshToken"].includes(k)), `device cleared (left: ${left.join(", ") || "none"})`);
ok(await page.isHidden("#delete-account"), "after clearing, signed out on this device");

ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
await browser.close();
if (failures) { console.error(`${failures} your-data check(s) failed`); process.exit(1); }
console.log("All your-data checks passed");
