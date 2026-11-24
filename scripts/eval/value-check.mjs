// "Does this match your report?" on every result card (roadmap B5, 24 Nov 2026). Synthetic report.
// Checks: every card asks; Yes and No are toggle buttons with a spoken note; No offers "Show me the
// line", which selects that exact line in the report text so it can be fixed; each answer sends one
// anonymous count (value_confirmed / value_mismatch) once per card and never a value; Spanish; the
// question is hidden in print; fits a 320px screen.
// Usage: serve the site on :4173, then node scripts/eval/value-check.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
const REPORT = "Sample Lab\nLDL cholesterol 162 H mg/dL 0-99\nHDL cholesterol 38 L mg/dL >39\nGlucose 92 mg/dL 70-99";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
for (const [size, width] of [["desktop", 1280], ["small phone", 320]]) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, serviceWorkers: "block" });
  const sent = [];
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await context.route("**/product/events", async (route) => { sent.push(JSON.parse(route.request().postData() || "{}")); await route.fulfill({ status: 200, body: "{}" }); });
  await context.addInitScript(() => { localStorage.setItem("carewiseTrackLocal", "1"); localStorage.setItem("carewiseTrackAutomation", "1"); });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", REPORT);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .result-card-item", { timeout: 15000 });

  const cards = await page.$$eval("#report-results .result-card-item", (els) => els.map((el) => ({ name: el.querySelector("header strong").textContent, asks: !!el.querySelector("[data-value-check]"), line: el.querySelector("[data-value-check]")?.dataset.valueLine })));
  check(cards.length >= 2 && cards.every((c) => c.asks), `${size}: every result card asks "Does this match your report?" (${cards.length} cards)`);
  const ldl = page.locator("#report-results .result-card-item", { hasText: "LDL" }).first();
  check(/LDL cholesterol 162 H mg\/dL 0-99/.test(cards.find((c) => /LDL/.test(c.name))?.line || ""), `${size}: the check knows the exact report line`);
  check(await ldl.locator("[data-value-check]").getAttribute("role") === "group" && /Does this match your report/.test(await ldl.locator("[data-value-check]").innerText()), `${size}: the question is a labelled group`);

  await ldl.locator('[data-value-answer="yes"]').click();
  check(await ldl.locator('[data-value-answer="yes"]').getAttribute("aria-pressed") === "true" && await ldl.locator('[data-value-answer="no"]').getAttribute("aria-pressed") === "false", `${size}: Yes is pressed, No is not`);
  check(/Checked against your report/.test(await ldl.locator(".result-card-verify-note").innerText()), `${size}: Yes says it was checked`);

  await ldl.locator('[data-value-answer="no"]').click();
  check(/Fix the line in the report text/.test(await ldl.locator(".result-card-verify-note").innerText()), `${size}: No explains how to fix it`);
  await ldl.locator("[data-value-fix]").click();
  const selected = await page.evaluate(() => { const t = document.querySelector("#report-text"); return t.value.slice(t.selectionStart, t.selectionEnd); });
  check(selected === "LDL cholesterol 162 H mg/dL 0-99" && await page.evaluate(() => document.activeElement.id) === "report-text", `${size}: "Show me the line" selects that exact line in the report text (${JSON.stringify(selected)})`);
  check(await page.inputValue("#report-text") === REPORT, `${size}: nothing in the report text was changed for the person`);

  await ldl.locator('[data-value-answer="yes"]').click();
  await page.waitForTimeout(300);
  const names = sent.map((e) => e.name).filter((n) => /^value_/.test(n));
  check(JSON.stringify(names) === JSON.stringify(["value_confirmed", "value_mismatch"]), `${size}: one count per card and answer, no double counting (${names.join(", ")})`);
  check(!/162|LDL|mg\/dL/.test(JSON.stringify(sent)), `${size}: no value or test name is sent`);

  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  await page.emulateMedia({ media: "print" });
  check(await ldl.locator("[data-value-check]").isHidden(), `${size}: the question is hidden when printing`);
  await page.emulateMedia({ media: "screen" });
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  await context.close();
}

// Spanish.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(`${base}#report-title`, { waitUntil: "load" });
  await page.fill("#report-text", REPORT);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .result-card-item", { timeout: 15000 });
  await page.evaluate(() => typeof setReportLanguage === "function" ? setReportLanguage("es") : document.querySelector('[data-report-language="es"], [data-lang="es"]')?.click());
  await page.waitForTimeout(500);
  const text = await page.locator("#report-results [data-value-check]").first().innerText().catch(() => "");
  check(/¿Coincide con su informe\?/.test(text), `Spanish: the question is in Spanish (${JSON.stringify(text.slice(0, 40))})`);
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} value check(s) failed`); process.exit(1); }
console.log("All value checks passed");
