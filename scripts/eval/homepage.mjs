// Homepage (editorial pass, 2026-11-09): example results by body area, three steps, privacy and
// follow-up. Checks the tabs with mouse and keyboard, that the example results use the app's own
// explanation and doctor question, and that the page has no sideways scroll on a phone.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the new sections.
// Usage: serve the site on :4173, then node scripts/eval/homepage.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const page = await (await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("[data-lp-insights]") && typeof buildReportView === "function");
  check(/finally understandable/.test(await page.innerText("h1")), `${size}: headline`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  const visible = () => page.evaluate(() => JSON.stringify([...document.querySelectorAll(".lp-ins-panel")].filter((p) => !p.hidden).map((p) => p.id)));
  check(await visible() === '["lp-ins-panel-kidneys"]', `${size}: kidneys shown first, one panel at a time`);
  await page.click("#lp-ins-tab-thyroid");
  check(await visible() === '["lp-ins-panel-thyroid"]' && await page.getAttribute("#lp-ins-tab-thyroid", "aria-selected") === "true", `${size}: click shows thyroid`);
  await page.focus("#lp-ins-tab-thyroid");
  await page.keyboard.press("ArrowRight");
  check(await visible() === '["lp-ins-panel-blood"]' && await page.evaluate(() => document.activeElement.id) === "lp-ins-tab-blood", `${size}: arrow key moves to blood count`);
  await page.keyboard.press("ArrowRight");
  check(await visible() === '["lp-ins-panel-kidneys"]', `${size}: arrow key wraps to kidneys`);
  // The example uses the same explanation and doctor question the app shows for these numbers.
  const app = await page.evaluate(() => {
    const a = analyzeReportTextLocally("Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3\neGFR 28 L mL/min/1.73m2 >=60");
    const v = buildReportView(a, "en");
    return [...v.cards, ...v.other].map((c) => [c.meaning, c.ask]);
  });
  const shown = await page.innerText("#lp-ins-panel-kidneys");
  check(app.length === 2 && app.every(([meaning, ask]) => shown.includes(meaning) && shown.includes(ask)), `${size}: example kidney cards match the app's own explanation and question`);
  check(/How are my kidneys working/.test(await page.innerText(".lp-mock-hero")), `${size}: hero preview shows a kidney question`);
  check((await page.$$("#how-it-works .lp-flow")).length === 3, `${size}: three steps`);
  // Footer: brand, the four link columns, the call to action, legal links and the safety line.
  const footer = await page.innerText("footer.ft-footer");
  check(/FollowThrough Health/.test(footer) && /Company/.test(footer) && /Explore/.test(footer) && /For healthcare professionals/.test(footer) && /Legal and account/.test(footer) && /Understand my report/.test(footer), `${size}: footer brand, columns and call to action`);
  check(/Mobile apps for iPhone and Android are in development/.test(footer), `${size}: footer says the apps are in development (no store badges)`);
  check(await page.$$eval("footer.ft-footer a", (links) => ["legal/privacy.html", "legal/terms.html", "legal/data-deletion.html", "#your-data"].every((href) => links.some((a) => a.getAttribute("href") === href))), `${size}: footer legal and data-control links`);
  check(/not a diagnosis, prescription, emergency service/.test(footer), `${size}: footer safety line`);
  const smallTargets = await page.$$eval("footer.ft-footer .ft-footer-cols a", (links) => links.filter((a) => a.getBoundingClientRect().height < 24).length);
  check(!smallTargets, `${size}: footer links are big enough to tap`);
  if (process.env.AXE_PATH) {
    // Let the tab panel's fade-in finish: a scan mid-fade sees half-transparent text.
    await page.waitForTimeout(500);
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [["#insights"], ["#how-it-works"], [".lp-follow"], [".lp-hero"], ["footer.ft-footer"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
}
// Reduced motion: the panel does not animate.
{
  const page = await (await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  const animation = await page.evaluate(() => getComputedStyle(document.querySelector("#lp-ins-panel-kidneys")).animationName);
  check(animation === "none", `reduced motion: no panel animation (${animation})`);
}
await browser.close();
if (failed) { console.log(`${failed} homepage check(s) failed`); process.exit(1); }
console.log("All homepage checks passed");
