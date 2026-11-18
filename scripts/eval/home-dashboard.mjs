// Home dashboard for returning visitors.
// History: 9 Nov first version; 13 Nov set like a homepage part; 16 Nov paper sheet; 18 Nov rebuilt as
// one grid; 18 Nov rebuilt again (owner: "too plain … do not use sample data").
// What it must do now:
// - A first visit shows no dashboard; the homepage is the welcome.
// - Made-up sample reports never appear on it. Someone who has only tried the sample sees a finished
//   "ready" state with no report data, names, counts or questions in it.
// - A saved report of the person's own is the focus: counts within and outside the lab's ranges from the
//   saved results, body areas, the results to talk about with exact saved value, unit and range.
// - Questions are the report's own when something is outside the lab's range; otherwise general, and
//   labelled so (owner's screenshot: "0 of 5 outside" above LDL and A1C questions).
// - Four next steps, with "Upload a report" first; reminders by type, never by private title.
// - An older report saved before each result was kept is a "Saved summary", nothing made up.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the dashboard.
// Usage: serve the site on :4173, then node scripts/eval/home-dashboard.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };
const SAMPLE = { id: "sample-1", person: "Maria (sample)", fileName: "sample-blood-work.txt", status: "analyzed locally", message: "0 of 5 results outside the lab's range. LDL cholesterol", questions: ["What LDL goal is appropriate for me based on my age, family history, blood pressure, and other risks?", "What changes would help lower my A1C safely over the next 3 months?"], createdAt: "2026-11-04T10:00:00Z" };

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }], ["small phone", { width: 320, height: 700 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const home = async () => {
    await page.goto(base, { waitUntil: "load" });
    await page.waitForFunction(() => !document.querySelector("#dashboard").hidden);
    return page.innerText("#dashboard");
  };
  const noSideways = async (label) => check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll (${label})`);

  await page.goto(base, { waitUntil: "load" });
  check(await page.$eval("#dashboard", (el) => el.hidden), `${size}: first visit shows no dashboard`);

  // 1. Only a made-up sample saved: the ready state, with nothing from the sample in it.
  await page.evaluate((sample) => localStorage.setItem("carewiseReports", JSON.stringify([sample])), SAMPLE);
  const ready = await home();
  check(/Welcome back/.test(ready) && /Your first report will appear here/.test(ready), `${size}: sample only: a ready state`);
  check(!/Maria|Blood test|of 5 results|LDL|A1C/.test(ready), `${size}: sample only: no sample name, report, count or questions`);
  check(!(await page.$("#dashboard .fd-questions, #dashboard .fd-stats, #dashboard .ft-dash-tag")), `${size}: sample only: no questions, counts or Sample tag on the dashboard`);
  const tiles = await page.$$eval("#dashboard .fd-tile", (els) => els.map((el) => el.querySelector("b").textContent));
  check(JSON.stringify(tiles) === JSON.stringify(["Upload a report", "Saved reports", "Prepare for a visit", "Reminders"]), `${size}: four next steps, upload first (${tiles.join(", ")})`);
  check(/None saved yet/.test(ready), `${size}: sample only: "Saved reports" says none saved yet`);
  check(/Private by default/.test(ready) && /Nothing is uploaded unless you choose to save it/.test(ready), `${size}: privacy note in the app's own words`);
  await noSideways("ready");
  // History still lists the sample, named as a person would write it and tagged "Sample".
  const historyText = await page.$eval(".v1-history-list", (el) => el.textContent).catch(() => "");
  check(/For Maria\b/.test(historyText) && !/\(sample\)|sample-blood-work/i.test(historyText) && /Sample/.test(historyText), `${size}: History lists the sample as "Blood test, For Maria" with a Sample tag`);

  // 2. A report of the person's own, with results outside the lab's range, plus a sample saved later.
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("carewiseReports"));
  await page.$eval("#report-name", (el) => { el.value = "Dad's kidney panel"; });
  await page.fill("#report-text", "Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3\neGFR 28 L mL/min/1.73m2 >=60\nPotassium 4.9 mmol/L 3.5-5.1");
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  await page.evaluate((sample) => {
    const saved = JSON.parse(localStorage.getItem("carewiseReports") || "[]");
    localStorage.setItem("carewiseReports", JSON.stringify([{ ...sample, createdAt: new Date().toISOString() }, ...saved]));
    localStorage.setItem("carewiseLabTrends", JSON.stringify([{ id: "lab-1", test: "Creatinine", value: "2.3", unit: "mg/dL", date: "2026-11-01", flag: "High" }]));
    localStorage.setItem("carewiseReminders", JSON.stringify([{ id: "r-1", title: "Private note", type: "Lab follow-up", startDate: "2099-01-15" }]));
  }, SAMPLE);
  const text = await home();
  check(/Dad's kidney panel/.test(await page.$eval("#dashboard .fd-report", (el) => el.textContent)), `${size}: the latest report of the person's own is shown, not the newer sample`);
  check(!/Maria|Blood test/.test(text), `${size}: the sample saved later does not appear`);
  check(/How are my kidneys working/.test(text) && /From this report/.test(text), `${size}: doctor questions are the report's own, and say so`);
  const outRows = await page.$$eval("#dashboard .fd-out li", (lis) => lis.map((li) => li.innerText.replace(/\s+/g, " ")));
  const creat = outRows.find((r) => /Creatinine/.test(r));
  check(creat && /2\.3 mg\/dL/.test(creat) && /0\.6-1\.3/.test(creat), `${size}: results to talk about show exact value, unit and lab range (${outRows.join(" | ")})`);
  check(!outRows.some((r) => /Potassium/.test(r)), `${size}: a result within range is not listed as one to talk about`);
  const counts = await page.$eval("#dashboard .fd-legend", (el) => el.innerText.replace(/\s+/g, " "));
  check(/Within the lab's range 1/.test(counts) && /Outside the lab's range 2/.test(counts) && /\b3\b/.test(await page.innerText("#dashboard .fd-total")), `${size}: counts come from the saved results (${counts})`);
  check(/2 outside the lab's range/.test(await page.innerText("#dashboard .fd-status")), `${size}: status says how many are outside, in words`);
  check(await page.$$eval("#dashboard .fd-areas li", (els) => els.length) >= 1, `${size}: body areas listed`);
  check(/1 on this device/.test(text) && /1 coming up/.test(text), `${size}: next steps count only the person's own reports and upcoming reminders`);
  check(/Lab follow-up/.test(text) && !/Private note/.test(text), `${size}: upcoming reminder by type, not its private title`);
  check(!/score/i.test(text), `${size}: no health score`);
  if (size !== "desktop") {
    const order = await page.evaluate(() => ["#dashboard .fd-head", "#dashboard .fd-tiles", "#dashboard .fd-report", "#dashboard .fd-side"].map((sel) => document.querySelector(sel).getBoundingClientRect().top));
    check(order.every((top, i) => !i || top > order[i - 1]), `${size}: welcome, next steps, report, then the rest`);
  }
  await noSideways("own report");
  await page.click('#dashboard .fd-tile-main');
  check(await page.evaluate(() => !document.querySelector(".report-panel").hidden), `${size}: "Upload a report" opens Upload`);

  // 3. An older report of the person's own, saved before each result was kept.
  await page.evaluate(() => localStorage.setItem("carewiseReports", JSON.stringify([{ id: "old-1", person: "Dad", fileName: "lab-results.pdf", status: "analyzed locally", message: "7 of 10 results outside the lab's range. LDL cholesterol", questions: ["What should my LDL goal be?"], createdAt: "2026-10-25T10:00:00Z" }])));
  const oldText = await home();
  check(/7 of 10 results outside the lab's range/.test(oldText) && /Saved summary/.test(oldText) && /saved by an earlier version/i.test(oldText) && !(await page.$("#dashboard .fd-total")), `${size}: an older report is a saved summary with its count, nothing made up`);
  check(/Saved with this report/.test(oldText), `${size}: an older report's questions say where they came from`);
  check(await page.$$eval("#dashboard [data-dash-open]", (els) => els.length) === 1, `${size}: an older report can be opened`);
  // The owner's screenshot case, for a report of the person's own: "0 of 5 outside" means general
  // questions, labelled so, without LDL or A1C.
  await page.evaluate((sample) => localStorage.setItem("carewiseReports", JSON.stringify([{ ...sample, id: "old-0", person: "Dad", fileName: "lab-results.pdf" }])), SAMPLE);
  await home();
  const zero = await page.innerText("#dashboard .fd-questions");
  check(/General questions you could ask/.test(zero) && /these are general questions/.test(zero) && !/LDL|A1C/.test(zero), `${size}: "0 outside" shows general questions, labelled, without LDL or A1C`);

  // 4. Every result within range: said in words, nothing listed to talk about, general questions.
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("carewiseReports"));
  await page.$eval("#report-name", (el) => { el.value = "Kidney check"; });
  await page.fill("#report-text", "Sample Lab\nCreatinine 1.0 mg/dL 0.6-1.3\neGFR 82 mL/min/1.73m2 >60\nPotassium 4.2 mmol/L 3.5-5.1");
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  await home();
  check(/All within the lab's ranges/.test(await page.innerText("#dashboard .fd-status")) && !(await page.$("#dashboard .fd-out")) && /General questions/.test(await page.innerText("#dashboard .fd-questions")), `${size}: all-within report says so, lists nothing to talk about, and labels its questions general`);
  await noSideways("all within");
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  if (process.env.AXE_PATH) {
    await page.goto(base, { waitUntil: "load" });
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [["#dashboard"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} home dashboard check(s) failed`); process.exit(1); }
console.log("All home dashboard checks passed");
