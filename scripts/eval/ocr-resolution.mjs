// Correcting a misread photo number must update everything together: the warning, summary,
// count, steps, copied summary and doctor brief, and nothing may be copied, shared or saved
// while a number is still unconfirmed. Usage: serve the site on :4173, then
//   node scripts/eval/ocr-resolution.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
// Calcium printed as 2.40 but read by the photo reader as "240": plausible-looking, and critical as read.
const PHOTO_TEXT = "Sample Lab\nCalcium 240 mmol/L 2.20-2.60\nSodium 140 mmol/L 135-145\nChloride 101 mmol/L 98-107";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const browser = await chromium.launch();
for (const [choice, expectUrgent] of [["2.40", false], ["240", true]]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${base}#report-title`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof showOcrResult === "function");
  await page.evaluate((text) => showOcrResult(text, "photo"), PHOTO_TEXT);
  await page.waitForSelector("#report-results .report-summary");
  const before = (await page.innerText("#report-results")).replace(/\s+/g, " ");
  ok(/Check this number/.test(before), `[${choice}] the doubtful calcium is marked "Check this number"`);
  ok(/prompt attention/i.test(before) && /Contact your doctor today/.test(before), `[${choice}] a possibly critical value keeps the report urgent while unconfirmed`);
  ok(/still to confirm/.test(before) && !/^.*0 of your 3 lab results are outside the lab's ranges\./.test(before), `[${choice}] the count says a number is still to confirm`);
  for (const action of ["doctor-brief", "save-detected-values", "copy-summary"]) {
    const button = page.locator(`[data-report-action="${action}"]`).first();
    if (await button.count()) {
      await button.evaluate((el) => el.click());
      ok(/Confirm the numbers/.test(await page.textContent("#report-status")), `[${choice}] ${action} is blocked until the number is confirmed`);
    }
  }
  ok((await page.textContent("#ocr-checks .ocr-check-line")).includes("Calcium 240 mmol/L 2.20-2.60"), `[${choice}] the check shows the whole line: test, number, unit and range`);
  // The person taps the value printed on their report.
  await page.click(`#ocr-checks [data-ocr-choice="${choice}"]`);
  await page.waitForTimeout(400);
  const after = (await page.innerText("#report-results")).replace(/\s+/g, " ");
  const state = await page.evaluate(() => ({ text: document.querySelector("#report-text").value, pack: latestReportSummaryPack, brief: buildDoctorBriefHtml(latestReportAnalysis), pending: unsureOcrKeys().length }));
  ok(state.text.includes(`Calcium ${choice} mmol/L`), `[${choice}] the report text now says ${choice}`);
  ok(state.pending === 0 && !/Check this number|still to confirm/.test(after), `[${choice}] nothing is left waiting for confirmation`);
  if (expectUrgent) {
    ok(/prompt attention/i.test(after) && /level labs often treat as urgent/.test(after), "[240] a confirmed critical value stays urgent and is labelled as such");
    ok(/1 of your 3 lab results is outside the lab's ranges/.test(after), "[240] the count includes the confirmed value");
  } else {
    ok(!/prompt attention|Contact your doctor today|level labs often treat as urgent/i.test(after), "[2.40] the urgent warning is gone");
    ok(!/\b240\b/.test(after), "[2.40] the misread 240 appears nowhere on the page (including What changed)");
    ok(/within the lab's ranges/.test(after), "[2.40] the summary says the results are within the lab's ranges");
    ok(!/\b240\b/.test(state.pack) && state.pack.includes("2.4"), "[2.40] the copied summary has 2.40, not 240");
    ok(!/\b240\b/.test(state.brief) && state.brief.includes("2.4"), "[2.40] the doctor brief has 2.40, not 240");
  }
  await page.locator('[data-report-action="copy-summary"]').first().evaluate((el) => el.click());
  ok(!/Confirm the numbers/.test(await page.textContent("#report-status")), `[${choice}] copying works again once confirmed`);
  const audit = await page.evaluate(() => getAuditEvents()[0]);
  ok(audit && audit.action === (choice === "240" ? "ocr_number_confirmed" : "ocr_number_corrected") && audit.message.includes("240"), `[${choice}] the correction is recorded in the on-device audit trail`);
  await page.close();
}
// "Something else: fix this line" highlights the line for editing and is recorded too.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${base}#report-title`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof showOcrResult === "function");
  await page.evaluate((text) => showOcrResult(text, "photo"), PHOTO_TEXT);
  await page.waitForSelector("#ocr-checks [data-ocr-edit]");
  await page.click("#ocr-checks [data-ocr-edit]");
  const state = await page.evaluate(() => { const box = document.querySelector("#report-text"); return { selected: box.value.slice(box.selectionStart, box.selectionEnd), audit: getAuditEvents()[0]?.action, status: document.querySelector("#report-status").textContent }; });
  ok(state.selected.trim() === "Calcium 240 mmol/L 2.20-2.60", "[edit] the line is highlighted for the person to fix");
  ok(state.audit === "ocr_line_edited" && /unit and range match your report/.test(state.status), "[edit] recorded, and the person is asked to match test, number, unit and range");
  await page.fill("#report-text", PHOTO_TEXT.replace("Calcium 240 mmol/L", "Calcium 9.6 mg/dL").replace("2.20-2.60", "8.6-10.3"));
  await page.click("#analyze-report");
  await page.waitForTimeout(400);
  const after = (await page.innerText("#report-results")).replace(/\s+/g, " ");
  ok(/within the lab's ranges/.test(after) && !/prompt attention|level labs often treat as urgent/.test(after), "[edit] re-explained with the corrected number, unit and range together");
  await page.close();
}
await browser.close();
console.log(failures ? `${failures} check(s) FAILED` : "All correction checks passed");
process.exitCode = failures ? 1 : 0;
