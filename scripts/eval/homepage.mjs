// Homepage (design pass 2, 2026-11-10; section plan approved by the owner): one story in order,
// no duplicate sections, one call-to-action label, a trust section that only states real
// protections, and the example explanation is the app's own. Desktop and phone, no sideways scroll.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the homepage sections.
// Usage: serve the site on :4173, then node scripts/eval/homepage.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const ORDER = ["lp-hero", "story", "guide", "lp-dark", "cmp", "lp-safety", "lp-doctors", "lp-pricing", "faq", "lp-final"];

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const page = await (await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof buildReportView === "function");
  check(/Understand your health reports\.\s*Know what to ask next\./.test(await page.innerText("h1")), `${size}: headline`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);

  // One story, in the approved order, with the duplicate sections gone.
  const order = await page.evaluate((names) => [...document.querySelectorAll(".lp-hero, section")]
    .map((node) => names.find((name) => node.classList.contains(name)))
    .filter(Boolean), ORDER);
  check(JSON.stringify(order) === JSON.stringify(ORDER), `${size}: sections in order (${order.join(" > ")})`);
  const removed = await page.evaluate(() => ["#insights", ".lp-problems", ".lp-follow", ".lp-jump"].filter((sel) => document.querySelector(sel)));
  check(!removed.length, `${size}: duplicate sections removed ${removed.join(", ")}`);

  // One label for the main action and one for the sample, everywhere on the homepage.
  const toUpload = await page.$$eval('.site-nav .nav-cta, .lp-hero .lp-drop strong, .lp-final .lp-btn-white, .story .lp-btn', (els) => els.map((el) => (el.getAttribute("aria-label") || el.textContent).replace(/\s+/g, " ").trim()));
  check(toUpload.length >= 4 && toUpload.every((label) => label === "Understand my report"), `${size}: one main action label (${[...new Set(toUpload)].join(" | ")})`);
  const sample = await page.$$eval(".lp-hero .hero-sample strong, .lp-final .lp-btn-ghost", (els) => els.map((el) => el.textContent.trim()));
  check(sample.length === 2 && sample.every((label) => label === "Try a sample"), `${size}: one sample label (${sample.join(" | ")})`);
  check(!/Explain a report, free/.test(await page.innerText("main")), `${size}: no leftover "Explain a report, free"`);

  // The demo uses the same explanation the app gives for these numbers.
  const app = await page.evaluate(() => {
    const view = buildReportView(analyzeReportTextLocally("Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3"), "en");
    return [...view.cards, ...view.other].map((card) => card.meaning);
  });
  const story = await page.textContent(".story");
  check(app.length === 1 && story.includes(app[0]), `${size}: demo explanation is the app's own`);
  check(/How are my kidneys working/.test(await page.innerText(".lp-mock-hero")), `${size}: hero preview shows a kidney question`);
  check((await page.$$("#how-it-works .lp-flow")).length === 3, `${size}: three steps`);
  check((await page.$$("#how-it-works .lp-cards article")).length === 4, `${size}: four feature cards (privacy duplicate removed, record and caregiver merged)`);

  // Trust: does, never, and your data, with links to the policies.
  const safety = await page.innerText("#safety");
  check(/FollowThrough Health does/.test(safety) && /FollowThrough Health never/.test(safety) && /Your data/.test(safety), `${size}: safety has does / never / your data`);
  check(!/HIPAA|certified|zero retention|clinically validated/i.test(safety), `${size}: no unsupported claims in the trust section`);
  check(await page.$$eval("#safety a", (links) => ["legal/privacy.html", "safety.html", "#your-data"].every((href) => links.some((a) => a.getAttribute("href") === href))), `${size}: privacy, safety and your-data links`);

  // Footer: brand, the four link columns, legal links and the safety line; no repeated call to action.
  const footer = await page.innerText("footer.ft-footer");
  check(/FollowThrough Health/.test(footer) && /Company/.test(footer) && /Explore/.test(footer) && /For healthcare professionals/.test(footer) && /Legal and account/.test(footer) && !/explained in a minute/.test(footer), `${size}: footer brand and columns, without repeating the closing call to action`);
  check(/Mobile apps for iPhone and Android are in development/.test(footer), `${size}: footer says the apps are in development (no store badges)`);
  check(await page.$$eval("footer.ft-footer a", (links) => ["legal/privacy.html", "legal/terms.html", "legal/data-deletion.html", "#your-data"].every((href) => links.some((a) => a.getAttribute("href") === href))), `${size}: footer legal and data-control links`);
  check(/not a diagnosis, prescription, emergency service/.test(footer), `${size}: footer safety line`);
  const smallTargets = await page.$$eval("footer.ft-footer .ft-footer-cols a", (links) => links.filter((a) => a.getBoundingClientRect().height < 24).length);
  check(!smallTargets, `${size}: footer links are big enough to tap`);
  check(await page.$('.lp-final a[href="#early-access-title"]') !== null, `${size}: early access still reachable`);

  // The tour still starts from the demo.
  await page.click("#start-tour");
  check(await page.evaluate(() => document.body.classList.contains("tour-active")), `${size}: "Take the 1-minute tour" starts the tour`);

  if (process.env.AXE_PATH) {
    await page.evaluate(() => typeof endTour === "function" && endTour());
    await page.waitForTimeout(400);
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [[".lp-hero"], [".story"], ["#how-it-works"], ["#safety"], [".lp-final"], ["footer.ft-footer"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
}
// Reduced motion: the hero preview rows do not animate.
{
  const page = await (await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  const animation = await page.evaluate(() => getComputedStyle(document.querySelector(".lp-mock-hero .lp-rows li")).animationName);
  check(animation === "none", `reduced motion: hero preview does not animate (${animation})`);
}
await browser.close();
if (failed) { console.log(`${failed} homepage check(s) failed`); process.exit(1); }
console.log("All homepage checks passed");
