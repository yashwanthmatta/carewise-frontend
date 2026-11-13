// History → "Results over time": built only from the person's saved reports. Synthetic data only.
// Checks: three explained reports for one person give one trend per repeated test; every value is the
// exact text the report showed, with its date and the lab's range; dates come from the report's own
// "Collected" line; nothing is drawn for a value with < or >; reports are never compared across people;
// one saved report shows an honest empty state; the chart has a text description; no sideways scroll.
// Usage: serve the site on :4173, then node scripts/eval/history-trends.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const MUM = [
  "Sample Lab\nCollected: 04 Mar 2026\nCreatinine 1.4 H mg/dL 0.6-1.3\neGFR 41 L mL/min/1.73m2 >=60\nTSH <0.01 L mIU/L 0.4-4.0",
  "Sample Lab\nCollected: 15 Jul 2026\nCreatinine 1.9 H mg/dL 0.6-1.3\neGFR 33 L mL/min/1.73m2 >=60\nTSH 0.3 L mIU/L 0.4-4.0",
  "Sample Lab\nCollected: 02 Nov 2026\nCreatinine 2.3 H mg/dL 0.6-1.3\neGFR 28 L mL/min/1.73m2 >=60\nTSH 0.2 L mIU/L 0.4-4.0",
];
const DAD = "Sample Lab\nCollected: 01 Oct 2026\nCreatinine 1.1 mg/dL 0.6-1.3";

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.route(/onrender\.com|jsdelivr|fonts\./, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  const explain = async (person, text) => {
    await page.evaluate(() => { location.hash = "report-title"; });
    await page.waitForSelector("#report-text", { state: "visible" });
    await page.click(`[data-whose="${person}"]`);
    await page.fill("#report-text", text);
    await page.click("#analyze-report");
    await page.waitForSelector("#report-results .result-card-item, #report-results .lab-panel", { state: "attached" });
  };

  await explain("Mum", MUM[0]);
  await page.evaluate(() => { location.hash = "saved-title"; renderReportHistory(); });
  await page.waitForTimeout(300);
  check(/Explain at least two of Mum's reports/.test(await page.innerText("#history-trends")), `${size}: one report: honest empty state`);
  check(/Report from Mar 4, 2026|Report from 4 Mar 2026/.test(await page.innerText(".v1-history-list")), `${size}: report titled by its test date, not "Local report analysis"`);

  await explain("Mum", MUM[1]);
  await explain("Mum", MUM[2]);
  await explain("Dad", DAD);
  await page.evaluate(() => { location.hash = "saved-title"; document.querySelector("#history-person-filter").value = ""; renderReportHistory(); });
  await page.waitForTimeout(300);
  check(/Choose whose reports to compare/.test(await page.innerText("#history-trends")), `${size}: everyone selected with two people: asks whose reports, never mixes people`);

  await page.evaluate(() => { const select = document.querySelector("#history-person-filter"); select.value = "Mum"; select.dispatchEvent(new Event("change")); });
  await page.waitForTimeout(300);
  const cards = await page.$$eval("#history-trends .trend-card", (items) => items.map((card) => ({
    name: card.querySelector("h5").textContent,
    rows: [...card.querySelectorAll("tbody tr")].map((row) => [...row.cells].map((cell) => cell.textContent.trim())),
    chart: card.querySelector("svg.trend-chart")?.getAttribute("aria-label") || "",
  })));
  const creat = cards.find((card) => card.name === "Creatinine");
  check(cards.length === 3, `${size}: one trend per repeated test (${cards.map((c) => c.name).join(", ")})`);
  check(creat && creat.rows.length === 3 && creat.rows.map((row) => row[1]).every((cell, i) => cell.startsWith(["1.4 mg/dL", "1.9 mg/dL", "2.3 mg/dL"][i])), `${size}: creatinine values exact and in date order`);
  check(creat && creat.rows.every((row) => row[2] === "0.6-1.3"), `${size}: each row shows that report's lab range`);
  check(creat && /2026/.test(creat.rows[0][0]) && /Mar/.test(creat.rows[0][0]) && !/Saved/.test(creat.rows[0][0]), `${size}: dates come from the report's Collected line`);
  check(creat && /1\.4 mg\/dL on .*Mar.*2026.*2\.3 mg\/dL on .*Nov.*2026/.test(creat.chart), `${size}: chart has a text description with values and dates`);
  check(!cards.some((card) => card.rows.some((row) => row[1].startsWith("1.1 mg/dL"))), `${size}: Dad's value never appears in Mum's trends`);
  const tsh = cards.find((card) => /TSH/.test(card.name));
  check(tsh && tsh.rows.length === 3 && tsh.rows[0][1].startsWith("<0.01 mIU/L"), `${size}: a "<" value is listed exactly`);
  const tshPoints = await page.$$eval("#history-trends .trend-card", (items) => items.find((card) => /TSH/.test(card.querySelector("h5").textContent))?.querySelectorAll("circle").length ?? -1);
  check(tshPoints === 2, `${size}: a "<" value has no point drawn (${tshPoints} points for 3 values)`);
  check(!/score|average|predicted/i.test(await page.innerText("#history-trends")), `${size}: no scores, averages or predictions`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  // Opening the site again at the homepage with reports already saved: History and the home
  // dashboard render while the page loads (a load-order bug here once hid the dashboard).
  await page.goto(base, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.evaluate(() => { location.hash = "saved-title"; });
  await page.waitForTimeout(400);
  check(/Report from/.test(await page.innerText(".v1-history-list")), `${size}: reload with saved reports: History renders`);
  check(!errors.length, `${size}: no script errors, including while loading with saved reports ${errors.join("; ")}`);
  await context.close();
}
await browser.close();
console.log(failed ? `\n${failed} history trend check(s) failed` : "\nAll history trend checks passed");
process.exit(failed ? 1 : 0);
