// The core report journey, end to end, on a made-up report (20 Nov 2026, owner: "make that journey
// effortless"): explain a report, find a result, read its explanation, find the privacy controls,
// and prepare questions for a doctor. Same steps at desktop, tablet, phone and small-phone widths.
// What it checks:
// - After "Explain report", focus moves to "Your report is ready" (a heading), not back to the button.
// - Nothing in the results is wider than the screen (html clips sideways overflow, so scrollWidth alone
//   would not catch it), and the header covers the top of the screen with no gap for text to show.
// - "On this page" jumps to each part, with the part's heading in view below the header and focused.
// - "Find a result" finds a test by name, shows its value, unit, label and lab range exactly as the
//   report printed them, and takes you to its card, or to its row in "All tests" (opened).
// - Your own questions are added under the report's, go into Copy questions and the printable page,
//   and can be removed.
// - "Your privacy" says where the report is, "Remove from this device" removes it from History on this
//   device only, and "All privacy controls" opens Your data.
// - Spanish shows the same parts in Spanish.
// Usage: serve the site on :4173, then node scripts/eval/report-journey.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
const REPORT = [
  "Sample Lab",
  "Hemoglobin 11.2 L g/dL 12.0-15.5",
  "TSH 6.8 H mIU/L 0.4-4.0",
  "Glucose, fasting 130 H mg/dL 70-99",
  "LDL cholesterol 160 H mg/dL <100",
  "Potassium 4.2 mmol/L 3.5-5.1",
  "Creatinine 0.9 mg/dL 0.6-1.3",
].join("\n");
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1440, height: 900 }], ["tablet", { width: 768, height: 1000 }], ["phone", { width: 390, height: 800 }], ["small phone", { width: 320, height: 700 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  const settle = () => page.waitForTimeout(900);
  // A heading counts as "in view" when it sits below the sticky header and above the bottom tab bar.
  const inView = (selector) => page.$eval(selector, (el) => {
    const header = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
    const tabBar = document.querySelector(".quick-nav");
    const bottom = tabBar && getComputedStyle(tabBar).position === "fixed" ? tabBar.getBoundingClientRect().top : innerHeight;
    const r = el.getBoundingClientRect();
    return r.top >= header - 1 && r.top < bottom - 20;
  });
  const focused = () => page.evaluate(() => document.activeElement?.id || document.activeElement?.className || "");

  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("carewiseReports"));
  await page.fill("#report-text", REPORT);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  await settle();

  // 1. Explain: focus and heading.
  check(await focused() === "result-ready-title", `${size}: after Explain, focus is on "Your report is ready"`);
  check(await page.$eval("#result-ready-title", (el) => el.getAttribute("role") === "heading" && el.textContent.trim() === "Your report is ready"), `${size}: "Your report is ready" is a heading`);

  // 2. Nothing wider than the screen; the header covers the top.
  const wide = await page.evaluate(() => [...document.querySelectorAll("#report-results .v1-result-card, #report-results .result-tools, #report-results .result-doctor, #report-results .result-privacy, #report-results .result-cards")]
    .filter((el) => el.getBoundingClientRect().right > innerWidth + 1).map((el) => el.className));
  check(!wide.length, `${size}: no part of the results is wider than the screen ${wide.join(", ")}`);
  await page.evaluate(() => scrollTo(0, scrollY + 400));
  await page.waitForTimeout(200);
  const topCovered = await page.evaluate(() => [Math.round(innerWidth * 0.3), Math.round(innerWidth * 0.7)].every((x) => document.elementFromPoint(x, 3)?.closest(".topbar")));
  check(topCovered, `${size}: the header covers the top of the screen, with no gap for text to show through`);
  if (viewport.width <= 480) {
    const [brandRight, signLeft] = await page.evaluate(() => [document.querySelector(".site-nav .brand-text strong").getBoundingClientRect().right, document.querySelector(".site-nav .nav-signin").getBoundingClientRect().left]);
    check(brandRight <= signLeft, `${size}: the name and "Sign in" do not overlap in the header`);
  }

  // 3. On this page: every part, in order, and each jump lands on its heading.
  const jumps = await page.$$eval("[data-result-jump]", (els) => els.map((el) => el.textContent.trim()));
  check(JSON.stringify(jumps) === JSON.stringify(["Results to look at", "Questions for your doctor", "All tests", "Save or share", "Your privacy"]), `${size}: "On this page" lists the parts (${jumps.join(", ")})`);
  for (const [name, id] of [["Your privacy", "result-privacy-title"], ["Questions for your doctor", "result-doctor-title"], ["All tests", "result-source-title"]]) {
    await page.click(`[data-result-jump="${id}"]`);
    await settle();
    check(await focused() === id && await inView(`#${id}`), `${size}: "${name}" jumps to its heading, in view and focused`);
  }
  check(await page.$eval("#result-source-title", (el) => el.closest("section").querySelector("details").open), `${size}: "All tests" opens the list of tests`);

  // 4. Find a result: exact values; a result with a card goes to its card, one without to its row.
  await page.fill("#result-find-input", "TSH");
  const tsh = await page.$$eval(".result-find-item", (els) => els.map((el) => el.innerText.replace(/\s+/g, " ")));
  check(tsh.length === 1 && /6\.8 mIU\/L/.test(tsh[0]) && /0\.4-4\.0/.test(tsh[0]) && /Far above the lab's range/.test(tsh[0]), `${size}: "TSH" finds one result with exact value, unit, label and lab range (${tsh.join(" | ")})`);
  await page.click(".result-find-item");
  await settle();
  check(await page.evaluate(() => document.activeElement.matches(".result-card-item") && /TSH/.test(document.activeElement.textContent) && /underactive/.test(document.activeElement.textContent)), `${size}: TSH opens its card with the explanation`);
  await page.fill("#result-find-input", "potass");
  const pot = await page.innerText(".result-find-item");
  check(/4\.2 mmol\/L/.test(pot) && /3\.5-5\.1/.test(pot) && /In range/.test(pot), `${size}: "potass" finds Potassium, within range, exact value and range`);
  await page.press("#result-find-input", "Enter");
  await settle();
  check(await page.evaluate(() => document.activeElement.matches(".lab-panel-row") && /Potassium/.test(document.activeElement.textContent) && !document.activeElement.hidden && document.activeElement.closest("details").open), `${size}: Enter takes a result without a card to its row in "All tests", opened`);
  await page.fill("#result-find-input", "zzzz");
  check(/No test on this report matches/.test(await page.innerText(".result-find-list")), `${size}: no match says so`);
  check(/No test on this report matches/.test(await page.textContent("[data-result-find-status]")), `${size}: matches are announced to screen readers`);
  await page.fill("#result-find-input", "");
  check(await page.$eval(".result-find-list", (el) => el.hidden), `${size}: clearing the box hides the list`);
  // Values in "Find a result" are the same text as in "All tests on your report".
  const same = await page.evaluate(() => [...document.querySelectorAll(".lab-panel-row[data-test-index]")].every((row) => {
    const match = findReportTests(row.querySelector("strong").textContent).find((m) => String(m.index) === row.dataset.testIndex);
    return match && row.children[1].textContent.startsWith(match.item.value) && row.children[2].textContent === (match.item.range || row.children[2].textContent);
  }));
  check(same, `${size}: "Find a result" shows the same value and range text as "All tests"`);

  // 5. Your own questions.
  const before = await page.$$eval(".result-doctor-questions li", (els) => els.length);
  await page.fill("#own-question-input", "Should I repeat this test before my visit?");
  await page.press("#own-question-input", "Enter");
  await page.fill("#own-question-input", "   ");
  await page.press("#own-question-input", "Enter");
  const items = await page.$$eval(".result-doctor-questions li", (els) => els.map((el) => el.innerText.replace(/\s+/g, " ")));
  check(items.length === before + 1 && /Your question Should I repeat this test before my visit\?/.test(items.at(-1)), `${size}: an own question is added under the report's, and a blank one is not`);
  const pack = await page.evaluate(() => latestReportQuestionPack);
  check(/My own questions:\n- Should I repeat this test before my visit\?/.test(pack) && /1\. /.test(pack), `${size}: Copy questions includes the report's questions and your own`);
  const brief = await page.evaluate(() => buildDoctorBriefHtml(latestReportAnalysis, "Me"));
  check(/Should I repeat this test before my visit\?/.test(brief), `${size}: the printable page includes your own question`);
  check(await page.$eval('[data-report-action="doctor-brief"]', (el) => el.textContent.trim()) === "Print questions for your visit", `${size}: the print button says what it does`);
  await page.click(".result-own-remove");
  check(await page.$$eval(".result-doctor-questions li", (els) => els.length) === before && !/My own questions/.test(await page.evaluate(() => latestReportQuestionPack)), `${size}: an own question can be removed, from the list and from Copy questions`);

  // 6. Spanish: the same parts, in Spanish; own questions kept for the same report.
  await page.fill("#own-question-input", "Kept across languages");
  await page.press("#own-question-input", "Enter");
  await page.selectOption("[data-report-language]", "es");
  await settle();
  const es = await page.$$eval("[data-result-jump]", (els) => els.map((el) => el.textContent.trim()));
  check(es.includes("Su privacidad") && es.includes("Preguntas para su médico") && /Su privacidad/.test(await page.innerText("#result-privacy-title")), `${size}: Spanish shows the same parts in Spanish (${es.join(", ")})`);
  check(/Su pregunta Kept across languages/.test(await page.innerText(".result-doctor-questions")), `${size}: own questions stay when the language changes`);
  await page.selectOption("[data-report-language]", "en");
  await settle();

  // 7. Privacy: where the report is, removing it from this device, and the full controls.
  const privacy = await page.innerText(".result-privacy");
  check(/Read on this device\. It was not uploaded to explain it\./.test(privacy) && /in History on this device/.test(privacy) && /only shared if you send a link or a PDF/.test(privacy), `${size}: "Your privacy" says where the report is`);
  check(!/encrypt|HIPAA|secure/i.test(privacy), `${size}: "Your privacy" makes no encryption, HIPAA or security claim`);
  const id = await page.evaluate(() => latestReportId);
  check(await page.evaluate((id) => JSON.parse(localStorage.getItem("carewiseReports") || "[]").some((r) => r.id === id), id), `${size}: the explained report is in History on this device`);
  await page.click("[data-report-forget]");
  check(await page.evaluate((id) => !JSON.parse(localStorage.getItem("carewiseReports") || "[]").some((r) => r.id === id), id), `${size}: "Remove from this device" removes it from History`);
  check(/Removed from History on this device/.test(await page.innerText(".result-privacy")) && !(await page.$("[data-report-forget]")) && await page.$("#report-results .report-summary"), `${size}: it says so, and the explanation stays on screen`);
  await page.click('.result-privacy a[href="#your-data"]');
  await settle();
  check(await page.evaluate(() => !document.querySelector("#your-data").closest("[hidden]") && document.querySelector("#your-data").getBoundingClientRect().height > 0), `${size}: "All privacy controls" opens Your data`);

  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} report journey check(s) failed`); process.exit(1); }
console.log("All report journey checks passed");
