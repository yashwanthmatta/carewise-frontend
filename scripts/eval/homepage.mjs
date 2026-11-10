// Homepage (editorial rebuild, 2026-11-10): one story in the owner's order (hero, demo, AI Health
// Guide, tests explained, how it works, comparison, DocBridge, trust, pricing, FAQ, closing), one
// label per action, header links to each part, a trust section that only states real protections,
// and the example explanation is the app's own. Desktop and phone, no sideways scroll.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the homepage sections.
// Usage: serve the site on :4173, then node scripts/eval/homepage.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const ORDER = ["fh-hero", "story", "guide", "fh-info", "fh-how", "fh-compare", "fh-doctors", "fh-trust", "fh-pricing", "faq", "fh-final"];

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const page = await (await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof buildReportView === "function");
  check(/Your health reports,\s*finally explained\./.test(await page.innerText("h1")), `${size}: headline`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);

  // One story, in the approved order, with the duplicate sections gone.
  const order = await page.evaluate((names) => [...document.querySelectorAll(".landing > section")]
    .map((node) => names.find((name) => node.classList.contains(name)))
    .filter(Boolean), ORDER);
  check(JSON.stringify(order) === JSON.stringify(ORDER), `${size}: sections in order (${order.join(" > ")})`);
  const removed = await page.evaluate(() => ["#insights", ".lp-problems", ".lp-follow", ".lp-jump", ".lp-hero", ".lp-cards"].filter((sel) => document.querySelector(sel)));
  check(!removed.length, `${size}: duplicate sections removed ${removed.join(", ")}`);

  // One label for the main action and one for the sample, everywhere on the homepage.
  const toUpload = await page.$$eval('.site-nav .nav-cta, .fh-hero .fh-drop span, .fh-final .fh-btn-primary, .story .fh-btn-primary, .fh-how .fh-btn-primary', (els) => els.map((el) => (el.getAttribute("aria-label") || el.textContent).replace(/\s+/g, " ").trim()));
  check(toUpload.length >= 5 && toUpload.every((label) => label === "Understand my report"), `${size}: one main action label (${[...new Set(toUpload)].join(" | ")})`);
  const sample = await page.$$eval("[data-try-sample]", (els) => els.map((el) => el.textContent.trim()));
  check(sample.length >= 3 && sample.every((label) => label === "Try a sample report"), `${size}: one sample label (${[...new Set(sample)].join(" | ")})`);
  // Header links go to real parts of the page.
  const links = await page.$$eval(".fh-site-links a", (els) => els.map((a) => [a.textContent.trim(), Boolean(document.querySelector(a.getAttribute("href")))]));
  check(links.length === 4 && links.every(([, exists]) => exists), `${size}: header links reach real sections (${links.map(([t]) => t).join(", ")})`);
  check(!/Explain a report, free/.test(await page.innerText("main")), `${size}: no leftover "Explain a report, free"`);

  // The demo uses the same explanation the app gives for these numbers.
  const app = await page.evaluate(() => {
    const view = buildReportView(analyzeReportTextLocally("Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3"), "en");
    return [...view.cards, ...view.other].map((card) => card.meaning);
  });
  const story = await page.textContent(".story");
  check(app.length === 1 && story.includes(app[0]), `${size}: demo explanation is the app's own`);
  check(/How are my kidneys working/.test(await page.innerText(".fh-preview")), `${size}: hero preview shows a kidney question`);
  check((await page.$$("#how-it-works .fh-step")).length === 3, `${size}: three steps`);
  // Tests listed as explained are ones the glossary really covers.
  const listed = await page.$$eval(".fh-area li", (els) => els.map((el) => el.textContent.trim()));
  const glossary = await (await page.request.get(`${base}glossary.html`)).text();
  check(listed.length >= 15 && listed.every((name) => glossary.includes(name)), `${size}: every listed test is in the glossary (${listed.length})`);

  // Trust: does, never, and your data, with links to the policies.
  const safety = await page.innerText("#safety");
  check(/FollowThrough Health does/i.test(safety) && /FollowThrough Health never/i.test(safety) && /Your data/i.test(safety), `${size}: safety has does / never / your data`);
  check(!/HIPAA|certified|zero retention|clinically validated/i.test(safety), `${size}: no unsupported claims in the trust section`);
  check(await page.$$eval("#safety a", (links) => ["legal/privacy.html", "safety.html", "#your-data"].every((href) => links.some((a) => a.getAttribute("href") === href))), `${size}: privacy, safety and your-data links`);

  // Footer: brand, the four link columns, legal links and the safety line; no repeated call to action.
  const footer = await page.innerText("footer.ft-footer");
  check(/FollowThrough Health/.test(footer) && /Company/.test(footer) && /Explore/.test(footer) && /For clinicians/.test(footer) && !/explained in a minute/.test(footer), `${size}: footer brand and columns, without repeating the closing call to action`);
  check(/Mobile apps for iPhone and Android are in development/.test(footer), `${size}: footer says the apps are in development (no store badges)`);
  check(await page.$$eval("footer.ft-footer a", (links) => ["legal/privacy.html", "legal/terms.html", "legal/data-deletion.html", "#your-data"].every((href) => links.some((a) => a.getAttribute("href") === href))), `${size}: footer legal and data-control links`);
  check(/not a diagnosis, prescription, emergency service/.test(footer), `${size}: footer safety line`);
  const smallTargets = await page.$$eval("footer.ft-footer .ft-footer-cols a", (links) => links.filter((a) => a.getBoundingClientRect().height < 24).length);
  check(!smallTargets, `${size}: footer links are big enough to tap`);
  check(await page.$('.fh-final a[href="#early-access-title"]') !== null, `${size}: early access still reachable`);

  // The tour still starts from the demo.
  await page.click("#start-tour");
  check(await page.evaluate(() => document.body.classList.contains("tour-active")), `${size}: "Take the 1-minute tour" starts the tour`);

  if (process.env.AXE_PATH) {
    await page.evaluate(() => typeof endTour === "function" && endTour());
    await page.waitForTimeout(400);
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [[".fh-hero"], [".story"], ["#explore-reports"], ["#how-it-works"], ["#compare"], ["#safety"], ["#faq"], [".fh-final"], ["footer.ft-footer"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
}
// Reduced motion: the hero preview rows do not animate.
{
  const page = await (await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  const animation = await page.evaluate(() => getComputedStyle(document.querySelector(".fh-preview-rows li")).animationName);
  check(animation === "none", `reduced motion: hero preview does not animate (${animation})`);
}
await browser.close();
if (failed) { console.log(`${failed} homepage check(s) failed`); process.exit(1); }
console.log("All homepage checks passed");
