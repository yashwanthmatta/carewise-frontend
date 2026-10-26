// The Upload screen shows which file is being read and lets the person cancel:
// a PDF shows the reading card and then the result; Cancel on a photo means nothing from it
// is used, even when the reader finishes later; a file dropped on the box is read; the
// progress bar only claims a percentage when the photo reader reports one.
// Usage: serve the site on :4173, then node scripts/eval/upload-reading.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const browser = await chromium.launch();
const errors = [];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
await context.route(/carewise-api\.onrender\.com/, (route) => route.fulfill({ status: 503, body: "{}", contentType: "application/json" }));
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));

// 1. A text PDF: the card shows the file, then the result replaces it.
await page.goto(`${base}#report-title`, { waitUntil: "load" });
ok(await page.isHidden("#reading-card"), "no reading card before a file is chosen");
await page.setInputFiles("#report-file", "scripts/eval/pdfs/a1c-normal.pdf");
await page.waitForSelector("#reading-card:not([hidden])", { timeout: 3000 }).catch(() => {});
const shown = await page.evaluate(() => ({ visible: !document.querySelector("#reading-card").hidden, name: document.querySelector("#reading-name").textContent, meta: document.querySelector("#reading-meta").textContent }));
ok(shown.name === "a1c-normal.pdf" && /PDF/.test(shown.meta), `reading card names the file (${shown.name}, ${shown.meta})`);
await page.waitForSelector("#report-results .report-summary", { timeout: 30000 }).catch(() => {});
ok(await page.isVisible("#report-results .report-summary"), "PDF is explained");
ok(await page.isHidden("#reading-card"), "reading card goes away when the result is shown");

// 2. A photo, cancelled straight away: nothing from it is used, even after the reader would have finished.
const shot = await browser.newPage({ viewport: { width: 900, height: 260 } });
await shot.setContent('<body style="margin:0;background:#fff;font:34px Arial;padding:24px">Sample Lab<br>Sodium 140 mmol/L 135-145<br>Potassium 4.1 mmol/L 3.5-5.1</body>');
const png = await shot.screenshot();
await shot.close();
await page.goto("about:blank");
await page.goto(`${base}#report-title`, { waitUntil: "load" });
await page.setInputFiles("#report-file", { name: "sample-report.png", mimeType: "image/png", buffer: png });
await page.waitForSelector("#reading-card:not([hidden])", { timeout: 3000 }).catch(() => {});
ok(await page.evaluate(() => !document.querySelector("#reading-bar").hasAttribute("aria-valuenow")), "no percentage is claimed before the reader reports one");
await page.click("#reading-cancel");
ok(await page.isHidden("#reading-card"), "Cancel hides the reading card");
ok(/Stopped/.test(await page.textContent("#report-status")), "Cancel says reading stopped");
await page.waitForTimeout(20000);
ok((await page.inputValue("#report-text")) === "", "a cancelled photo never fills in the report");
ok(!(await page.isVisible("#report-results .report-summary")), "a cancelled photo is never explained");

// 3. A photo read to the end reports real progress.
await page.goto("about:blank");
await page.goto(`${base}#report-title`, { waitUntil: "load" });
await page.evaluate(() => {
  window.__progress = [];
  new MutationObserver(() => {
    const value = document.querySelector("#reading-bar").getAttribute("aria-valuenow");
    if (value) window.__progress.push(Number(value));
  }).observe(document.querySelector("#reading-bar"), { attributes: true });
});
await page.setInputFiles("#report-file", { name: "sample-report.png", mimeType: "image/png", buffer: png });
await page.waitForFunction(() => /Sodium/i.test(document.querySelector("#report-text").value), null, { timeout: 90000 }).catch(() => {});
const progress = await page.evaluate(() => window.__progress);
ok(/Sodium/i.test(await page.inputValue("#report-text")), "photo is read when not cancelled");
ok(progress.length > 0 && progress.every((value, index) => value >= 0 && value <= 100 && (index === 0 || value >= progress[index - 1])), `progress only moves forward (${progress.slice(0, 6).join(", ")}${progress.length > 6 ? "…" : ""})`);

// 4. A file dropped on the Upload box is read.
await page.goto("about:blank");
await page.goto(`${base}#report-title`, { waitUntil: "load" });
await page.evaluate(() => {
  const transfer = new DataTransfer();
  transfer.items.add(new File(["Sample Lab\nLDL cholesterol 148 mg/dL <100\nA1C 5.4 % 4.0-5.6"], "dropped.txt", { type: "text/plain" }));
  document.querySelector(".composer-drop").dispatchEvent(new DragEvent("drop", { dataTransfer: transfer, bubbles: true, cancelable: true }));
});
await page.waitForSelector("#report-results .report-summary", { timeout: 15000 }).catch(() => {});
ok(/LDL/.test(await page.inputValue("#report-text")) && await page.isVisible("#report-results .report-summary"), "a dropped file is read and explained");

// 5. On the result, the plain-English summary comes before the doctor actions.
const order = await page.evaluate(() => {
  const summary = document.querySelector("#report-results .report-summary");
  const toolbar = document.querySelector("#report-results .result-toolbar");
  return Boolean(summary && toolbar && summary.compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING);
});
ok(order, "summary comes first, then Take it to your doctor");
ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "fits a phone screen");

await browser.close();
ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
if (failures) {
  console.error(`${failures} upload check(s) failed`);
  process.exit(1);
}
console.log("All upload checks passed");
