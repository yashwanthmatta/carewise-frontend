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
// Added 21 Nov:
// - "Save or load reports" is part of the form's action row, not on its own above the results.
// - "Print questions for your visit" opens the brief in a dialog on this page (no new tab, which phone
//   browsers can block), with the same content, focus on its title, Escape to close and focus back on
//   the button; printing the page while it is open prints only the brief.
// - What a Save or share button did is shown next to it, not only in the status line above the form.
// - Below 900px the help button is a slim tab on the screen edge; on desktop it sits outside the page.
// - A long report (45 results) explains quickly, fits the screen, and lists every test.
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

  // 2b. "Save or load reports" sits in the form's action row, before the status line and the results.
  check(await page.evaluate(() => {
    const more = document.querySelector(".composer-more");
    const status = document.querySelector("#report-status");
    return !!more?.closest(".composer-actions") && !!(more.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING);
  }), `${size}: "Save or load reports" is in the form's action row, not above the results`);
  // 2c. The help button never sits over the page's content column.
  const helpFits = await page.evaluate(() => {
    const help = document.querySelector("#help-chat-open").getBoundingClientRect();
    if (innerWidth <= 900) return Math.round(help.right) === innerWidth && help.width <= 32 && help.width >= 24 && help.height >= 44;
    return help.left >= document.querySelector("#report-results").getBoundingClientRect().right;
  });
  check(helpFits, `${size}: the help button ${viewport.width <= 900 ? "is a slim tab on the screen edge" : "sits outside the results column"}`);

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

  // 4b. A Save or share button's result is shown next to it, with the same words as the status line.
  await page.locator('[data-report-action="packet-pdf"]').first().scrollIntoViewIfNeeded();
  await Promise.all([page.waitForEvent("download", { timeout: 10000 }).catch(() => null), page.click('[data-report-action="packet-pdf"]')]);
  await page.waitForTimeout(300);
  const local = await page.$eval(".result-save", (el) => { const p = el.querySelector(":scope > .result-local-status"); return p ? { text: p.textContent, hidden: p.getAttribute("aria-hidden") } : null; });
  const statusText = await page.textContent("#report-status");
  check(local && local.text === statusText && /Saved followthrough-lab-summary/.test(local.text) && local.hidden === "true", `${size}: "PDF for your doctor" says what happened next to the button (${local?.text})`);

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
  // 5b. The brief opens in a dialog on this page, not a new tab, with the same content.
  let opened = 0;
  context.on("page", () => { opened += 1; });
  await page.locator('[data-report-action="doctor-brief"]').scrollIntoViewIfNeeded();
  await page.click('[data-report-action="doctor-brief"]');
  await page.waitForFunction(() => document.querySelector("#doctor-brief-dialog")?.open && /Patient questions/.test(document.querySelector("#doctor-brief-dialog iframe")?.contentDocument?.body?.innerText || ""), null, { timeout: 5000 }).catch(() => {});
  const shown = await page.evaluate(() => {
    const dialog = document.querySelector("#doctor-brief-dialog");
    const doc = dialog?.querySelector("iframe")?.contentDocument;
    return {
      open: !!dialog?.open, focus: document.activeElement?.id, title: dialog?.querySelector("h2")?.textContent,
      body: doc?.body?.innerText || "", inline: !!doc?.querySelector("[onclick]"), innerHidden: doc?.querySelector("[data-brief-print]")?.hidden,
      print: dialog?.querySelector("[data-brief-dialog-print]")?.textContent, fits: dialog ? dialog.getBoundingClientRect().right <= innerWidth + 1 : false,
    };
  });
  check(shown.open && opened === 0, `${size}: "Print questions for your visit" opens a dialog on this page, not a new tab`);
  check(/Patient questions/.test(shown.body) && /Should I repeat this test before my visit\?/.test(shown.body) && /6\.8 mIU\/L/.test(shown.body), `${size}: the dialog shows the brief, with the exact values and your own question`);
  check(shown.focus === "doctor-brief-dialog-title" && shown.title === "Questions for your visit" && shown.print === "Print or save as PDF", `${size}: focus is on the dialog's title, and its print button is named`);
  check(!shown.inline && shown.innerHidden === true && shown.fits, `${size}: no inline handlers, one print button, and the dialog fits the screen`);
  await page.emulateMedia({ media: "print" });
  const printOnly = await page.evaluate(() => [...document.body.children].filter((el) => el.id !== "doctor-brief-dialog" && getComputedStyle(el).display !== "none").map((el) => el.tagName + (el.id ? `#${el.id}` : "")));
  await page.emulateMedia({ media: "screen" });
  check(!printOnly.filter((t) => !/^(SCRIPT|NOSCRIPT|TEMPLATE|STYLE|LINK)/.test(t)).length, `${size}: printing the page while the brief is open prints only the brief ${printOnly.join(", ")}`);
  await page.keyboard.press("Escape");
  check(await page.evaluate(() => !document.querySelector("#doctor-brief-dialog").open && document.activeElement?.dataset.reportAction === "doctor-brief"), `${size}: Escape closes the dialog and focus goes back to the button`);
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

// A long report: 45 made-up results (lipids, metabolic panel, blood count, thyroid, vitamins).
const LONG_REPORT = [
  "Sample Lab", "Complete metabolic panel, lipids, CBC, thyroid, vitamins",
  "Sodium 140 mmol/L 135-145", "Potassium 4.2 mmol/L 3.5-5.1", "Chloride 102 mmol/L 98-107",
  "CO2 25 mmol/L 22-29", "BUN 15 mg/dL 7-20", "Creatinine 1.0 mg/dL 0.6-1.3",
  "eGFR 82 mL/min/1.73m2 >60", "Glucose 104 H mg/dL 70-99", "Calcium 9.4 mg/dL 8.6-10.3",
  "Total protein 7.0 g/dL 6.0-8.3", "Albumin 4.3 g/dL 3.5-5.0", "Total bilirubin 0.8 mg/dL 0.1-1.2",
  "ALP 72 U/L 44-147", "ALT 41 H U/L 7-35", "AST 30 U/L 10-40",
  "Total cholesterol 228 H mg/dL <200", "LDL cholesterol 152 H mg/dL <100", "HDL cholesterol 48 mg/dL >40",
  "Triglycerides 168 H mg/dL <150", "Non-HDL cholesterol 180 H mg/dL <130",
  "WBC 6.1 x10^9/L 4.0-11.0", "RBC 4.6 x10^12/L 4.2-5.4", "Hemoglobin 13.8 g/dL 12.0-16.0",
  "Hematocrit 41.2 % 36-46", "MCV 89 fL 80-100", "MCH 30.0 pg 27-33", "MCHC 33.5 g/dL 32-36",
  "RDW 13.1 % 11.5-14.5", "Platelets 250 x10^9/L 150-400", "Neutrophils 3.6 x10^9/L 1.8-7.7",
  "Lymphocytes 1.9 x10^9/L 1.0-4.8", "Monocytes 0.4 x10^9/L 0.2-1.0", "Eosinophils 0.15 x10^9/L 0.0-0.5",
  "TSH 3.10 mIU/L 0.40-4.50", "Free T4 1.2 ng/dL 0.8-1.8", "Vitamin D 22 L ng/mL 30-100",
  "Vitamin B12 410 pg/mL 200-900", "Folate 9.8 ng/mL >3.0", "Ferritin 48 ng/mL 15-150",
  "Iron 85 ug/dL 60-170", "A1C 5.9 H % 4.0-5.6", "Magnesium 2.0 mg/dL 1.7-2.2",
  "Phosphorus 3.5 mg/dL 2.5-4.5", "Uric acid 6.1 mg/dL 2.6-6.0", "CRP 2.4 mg/L <3.0",
].join("\n");
for (const [size, viewport] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 800 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", LONG_REPORT);
  const started = Date.now();
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  const took = Date.now() - started;
  check(took < 3000, `long report, ${size}: explained in ${took} ms (under 3 s)`);
  check(await page.$eval("#report-results .summary-total b", (el) => el.textContent.trim()) === "45", `long report, ${size}: the summary counts all 45 tests`);
  await page.evaluate(() => document.querySelector("#result-source-title")?.closest("section")?.querySelector("details")?.setAttribute("open", ""));
  await page.waitForTimeout(300);
  const rows = await page.$$eval("#report-results .lab-panel-row[data-test-index]", (els) => els.length);
  check(rows === 45, `long report, ${size}: "All tests" lists every test (${rows})`);
  const wide = await page.evaluate(() => [...document.querySelectorAll("#report-results *")].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).length);
  check(!wide, `long report, ${size}: nothing in the results is wider than the screen (${wide})`);
  await page.fill(".result-find input", "chol");
  await page.waitForTimeout(200);
  const found = await page.$$eval(".result-find-list li", (els) => els.map((el) => el.innerText.replace(/\s+/g, " ")));
  check(found.length >= 3 && found.some((t) => /152 mg\/dL/.test(t) && /<100/.test(t)), `long report, ${size}: "chol" finds the cholesterol results with exact values (${found.length})`);
  check(!errors.length, `long report, ${size}: no script errors ${errors.join("; ")}`);
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} report journey check(s) failed`); process.exit(1); }
console.log("All report journey checks passed");
