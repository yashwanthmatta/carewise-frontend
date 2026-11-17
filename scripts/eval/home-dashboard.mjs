// Home dashboard (2026-11-09): someone with saved reports sees "Welcome back" above the homepage,
// with the latest report, its own doctor questions, recent reports, tracked results and upcoming
// reminders. A first visit shows no dashboard. No score is shown.
// 13 Nov rebuild: set like a homepage part. The results to talk about are listed with the exact value,
// unit and lab range saved with the report; empty sections are left out instead of shown as boxes.
// 16 Nov: the latest report is drawn as a paper sheet. Results outside the lab's range are circled
// in pen and noted in the app's own label and range; results within range are on the sheet, unmarked.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the dashboard.
// Usage: serve the site on :4173, then node scripts/eval/home-dashboard.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(base, { waitUntil: "load" });
  check(await page.$eval("#dashboard", (el) => el.hidden), `${size}: first visit shows no dashboard`);

  // Explain a report, then come back home.
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.$eval("#report-name", (el) => { el.value = "Dad's kidney panel"; });
  await page.fill("#report-text", "Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3\neGFR 28 L mL/min/1.73m2 >=60\nPotassium 4.9 mmol/L 3.5-5.1");
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem("carewiseLabTrends", JSON.stringify([{ id: "lab-1", test: "Creatinine", value: "2.3", unit: "mg/dL", date: "2026-11-01", flag: "High" }]));
    localStorage.setItem("carewiseReminders", JSON.stringify([{ id: "r-1", title: "Private note", type: "Lab follow-up", startDate: "2099-01-15" }]));
  });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForFunction(() => !document.querySelector("#dashboard").hidden);
  const text = await page.innerText("#dashboard");
  // The file name is printed in capitals on the sheet, so read the text as written, not as shown.
  check(/Welcome back/.test(text) && /Dad's kidney panel/.test(await page.$eval("#dashboard", (el) => el.textContent)), `${size}: dashboard shows the latest report`);
  check(/1 of 3 results outside the lab's range|2 of 3 results outside the lab's range/.test(text), `${size}: latest report shows its lab-range count`);
  check(/How are my kidneys working/.test(text), `${size}: doctor questions are the report's own`);
  check(!/Which results matter most for me/.test(text.split("Tracking")[0]), `${size}: no general question in the top three`);
  const sheet = await page.$$eval("#dashboard .ft-dash-paper .ed-sheet tbody tr", (trs) => trs.map((tr) => ({ text: tr.innerText.replace(/\s+/g, " "), mark: tr.querySelector("[data-mark]")?.dataset.mark || "" })));
  const creat = sheet.find((r) => /Creatinine/.test(r.text));
  check(creat && /2\.3 mg\/dL/.test(creat.text) && /0\.6-1\.3/.test(creat.text), `${size}: sheet shows exact value, unit and lab range (${sheet.map((r) => r.text).join(" | ")})`);
  const note = creat?.mark ? await page.$eval(`#dashboard [data-note="${creat.mark}"]`, (el) => el.textContent).catch(() => "") : "";
  check(creat?.mark && /^Creatinine: .*above.* \(0\.6-1\.3\)$/.test(note.trim()), `${size}: out-of-range result is circled with the app's label and range (${note})`);
  const potassium = sheet.find((r) => /Potassium/.test(r.text));
  check(potassium && !potassium.mark, `${size}: a result within range is on the sheet but not marked`);
  check(await page.$$eval("#dashboard .ed-ink path", (els) => els.length) >= 1, `${size}: pen marks are drawn`);
  check(await page.$$eval("#dashboard .ft-dash-card", (els) => els.length) === 0, `${size}: no card grid`);
  check(/Creatinine/.test(text) && /2\.3 mg\/dL/.test(text), `${size}: tracked result with value and unit`);
  check(/Lab follow-up/.test(text) && !/Private note/.test(text), `${size}: upcoming reminder by type, not its private title`);
  check(!/score/i.test(text), `${size}: no health score`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  await page.click('#dashboard a[href="#report-title"]');
  check(await page.evaluate(() => !document.querySelector(".report-panel").hidden), `${size}: "Understand a new report" opens Upload`);
  // A report saved before each result was kept (Oct 2026) has only the count sentence. The summary
  // must not say "no results outside the lab's range" under a count that says 7 (owner's screenshot, 16 Nov).
  await page.evaluate(() => {
    localStorage.setItem("carewiseReports", JSON.stringify([{ id: "old-1", person: "Maria (sample)", fileName: "sample-blood-work.txt", status: "analyzed locally", message: "7 of 10 results outside the lab's range. LDL cholesterol", questions: ["What should my LDL goal be?"], createdAt: "2026-10-25T10:00:00Z" }]));
  });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForFunction(() => !document.querySelector("#dashboard").hidden);
  const oldText = await page.innerText("#dashboard");
  check(/7 of 10 results outside the lab's range/.test(oldText) && !/No results outside|Ningún resultado/i.test(oldText), `${size}: an older report keeps its count and never says "no results" under it`);
  check(await page.$$eval("#dashboard [data-dash-open]", (els) => els.length) === 1, `${size}: an older report offers to open the full report`);
  // Names read as a person would write them (owner, 17 Nov: "i dont like some sample names"). The file
  // name is not shown in capitals and "(sample)" is not part of the person's name; a "Sample" tag still
  // marks made-up data.
  check(/Blood test/.test(oldText) && !/sample-blood-work|SAMPLE-BLOOD-WORK/i.test(oldText), `${size}: report named "Blood test", not its file name`);
  check(/Maria's latest report/.test(oldText) && !/\(sample\)/i.test(oldText), `${size}: person shown as "Maria", without "(sample)"`);
  check(await page.$$eval("#dashboard .ft-dash-tag", (els) => els.length === 1 && /sample/i.test(els[0].textContent)), `${size}: made-up data still tagged "Sample"`);
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
