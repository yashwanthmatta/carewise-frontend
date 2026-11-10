// Visual quality gates from the design review (docs/premium-design-quality-review.md).
// Rendered checks, synthetic data only:
// - no page-level sideways scroll on Home and on a report's results at 1440, 1024, 768, 390 and 320 px
// - at 320 px the header's "Explain" button does not cover the brand name
// - the hero preview shows each value with its unit
// - the hero stage has no looping animation (no constant CPU use)
// - results: 4 cards to look at sit 2 per row on a wide screen (no lone card), the shown value text
//   equals the analysis exactly (the smaller unit is only styling), and Listen still reads value + unit
// - the footer does not repeat the closing call to action
// Usage: serve the site on :4173, then node scripts/eval/design-quality.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const REPORT = [
  "Sample Lab",
  "Hemoglobin 11.2 L g/dL 12.0-15.5",
  "Creatinine 2.3 H mg/dL 0.6-1.3",
  "eGFR 28 L mL/min/1.73m2 >=60",
  "Potassium 4.9 mmol/L 3.5-5.1",
  "Sodium 139 mmol/L 135-145",
  "LDL cholesterol 148 H mg/dL <100",
].join("\n");

const browser = await chromium.launch();
async function open(width, hash = "") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
  await context.route(/onrender\.com|jsdelivr/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}${hash}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  return { page, context, errors };
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

for (const width of [1440, 1024, 768, 390, 320]) {
  const { page, context, errors } = await open(width);
  check(await noSideScroll(page), `${width}px home: no sideways scroll`);
  if (width === 320) {
    const overlap = await page.evaluate(() => {
      const brand = document.querySelector(".site-nav .brand-text strong")?.getBoundingClientRect();
      const cta = document.querySelector(".site-nav .nav-cta")?.getBoundingClientRect();
      if (!brand || !cta || !brand.width) return false;
      const text = document.querySelector(".site-nav .brand-text strong");
      const clipped = text.scrollWidth > text.clientWidth + 1;
      return brand.right > cta.left - 4 || clipped;
    });
    check(!overlap, "320px: the Explain button does not cover the brand name");
  }
  if (width === 1440) {
    const rows = await page.$$eval(".lp-mock-hero .lp-rows li b", (items) => items.map((b) => b.textContent.trim()));
    check(rows.length === 4 && rows.every((text) => /^\d[\d.]* \S+/.test(text)), `hero preview shows value and unit (${rows.join(" | ")})`);
    const looping = await page.evaluate(() => document.querySelector(".lp-hero .lp-stage")?.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity).length ?? 0);
    check(looping === 0, "hero stage has no looping animation");
    check(!(await page.$(".ft-footer .ft-footer-headline")), "footer does not repeat the closing call to action");
    check(await page.$(".lp-hero .lp-float") === null, "no decorative floating labels over the preview");
  }
  check(!errors.length, `${width}px home: no script errors ${errors.join("; ")}`);
  await context.close();
}

for (const width of [1440, 390, 320]) {
  const { page, context, errors } = await open(width, "#report-title");
  await page.fill("#report-text", REPORT);
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .result-card-item", { timeout: 15000 });
  await page.waitForTimeout(400);
  check(await noSideScroll(page), `${width}px results: no sideways scroll`);
  const shown = await page.$$eval("#report-results .result-card-item", (cards) => cards.map((card) => ({
    name: card.querySelector("header strong")?.textContent || "",
    value: card.querySelector(".result-card-value b")?.textContent || "",
    top: Math.round(card.getBoundingClientRect().top),
  })));
  const expected = await page.evaluate((text) => {
    const view = buildReportView(analyzeReportTextLocally(text), "en");
    return [...view.cards, ...(view.other || [])].map((card) => ({ name: card.name, value: card.value }));
  }, REPORT);
  const exact = expected.every((card) => shown.some((item) => item.name === card.name && item.value === card.value));
  check(exact && shown.length === expected.length, `${width}px results: every card shows the exact value text (${shown.length} cards)`);
  const units = await page.$$eval("#report-results .result-card-unit", (spans) => spans.map((span) => span.textContent));
  check(units.includes("mg/dL") && units.includes("mL/min/1.73m2"), `${width}px results: units set apart for reading (${units.length})`);
  if (width === 1440) {
    const first = await page.$$eval("#report-results .result-cards > .result-cards-grid .result-card-item, #report-results .result-cards-grid .result-card-item", (cards) => {
      const grid = cards[0]?.parentElement;
      const items = [...grid.children];
      const rows = new Map();
      items.forEach((item) => { const top = Math.round(item.getBoundingClientRect().top); rows.set(top, (rows.get(top) || 0) + 1); });
      return { count: items.length, perRow: [...rows.values()] };
    });
    const lone = first.count % 2 === 0 && first.perRow.some((n) => n === 1);
    check(first.count >= 2 && !lone, `1440px: results to look at sit evenly (${first.count} cards, rows of ${first.perRow.join("+")})`);
  }
  const listen = await page.evaluate(() => listenParts().join(" "));
  check(/148 milligrams per deciliter/.test(listen) || /148 mg\/dL/.test(listen), `${width}px: Listen still reads the value with its unit`);
  check(!errors.length, `${width}px results: no script errors ${errors.join("; ")}`);
  await context.close();
}

await browser.close();
console.log(failed ? `\n${failed} design quality check(s) failed` : "\nAll design quality checks passed");
process.exit(failed ? 1 : 0);
