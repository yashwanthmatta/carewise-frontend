// Homepage ("read it together" rebuild, 2026-11-13): a lab report on paper with handwritten notes
// in the hero, then ruled parts with a margin label: how it works, why this exists, what it reads,
// the guide, what it won't do, clinics, pricing, questions. Checks the order, one label per action,
// that the hero's notes are the app's own words for those numbers and that each pen circle sits on
// its own value, real header links, honest trust wording, the footer, the tour, no looping motion,
// and no sideways scroll on desktop and phone.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the homepage sections.
// Usage: serve the site on :4173, then node scripts/eval/homepage.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const ORDER = ["fh-hero", "fx-glance", "fh-how", "ed-why", "fh-info", "fh-labs", "guide", "fh-trust", "fh-doctors", "fx-compare", "fh-pricing", "faq"];

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const page = await (await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof buildReportView === "function");
  check(/Understand every result\.\s*Follow\s*through\./.test(await page.innerText("h1")), `${size}: headline`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);

  // One story, in the approved order, with the duplicate sections gone.
  const order = await page.evaluate((names) => [...document.querySelectorAll(".landing > section")]
    .map((node) => names.find((name) => node.classList.contains(name)))
    .filter(Boolean), ORDER);
  check(JSON.stringify(order) === JSON.stringify(ORDER), `${size}: sections in order (${order.join(" > ")})`);
  const removed = await page.evaluate(() => ["#insights", ".lp-problems", ".lp-follow", ".lp-jump", ".lp-hero", ".lp-cards", "#report-story", ".fh-final", ".fh-price-grid"].filter((sel) => document.querySelector(sel)));
  check(!removed.length, `${size}: duplicate sections removed ${removed.join(", ")}`);

  // One label for the main action and one for the sample, everywhere on the homepage.
  const toUpload = await page.$$eval('.site-nav .nav-cta, .fh-hero .fh-drop span, .fh-how a[href="#report-title"]', (els) => els.map((el) => (el.getAttribute("aria-label") || el.textContent).replace(/\s+/g, " ").trim()));
  check(toUpload.length >= 3 && toUpload.every((label) => label === "Understand my report"), `${size}: one main action label (${[...new Set(toUpload)].join(" | ")})`);
  const sample = await page.$$eval(".landing [data-try-sample]:not(.fx-panel-foot)", (els) => els.map((el) => el.textContent.trim()));
  check(sample.length >= 1 && sample.every((label) => label === "Try a sample report"), `${size}: one sample label (${[...new Set(sample)].join(" | ")})`);
  check(await page.$eval(".fh-hero", (hero) => hero.getAnimations({ subtree: true }).length) === 0, `${size}: the hero does not animate`);
  // Header links go to real parts of the page, or (17 Nov: "Lab testing") to a page that exists.
  const links = await page.$$eval(".fh-site-links a", (els) => els.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
  const reachable = await Promise.all(links.map(async ([, href]) => href.startsWith("#")
    ? page.evaluate((selector) => Boolean(document.querySelector(selector)), href)
    : (await page.request.get(new URL(href, base).href)).ok()));
  check(links.length === 5 && reachable.every(Boolean), `${size}: header links reach real sections or pages (${links.map(([t]) => t).join(", ")})`);
  check(!/Explain a report, free/.test(await page.innerText("main")), `${size}: no leftover "Explain a report, free"`);

  // 18 Nov redesign: the made-up results on the homepage use the app's own words for those numbers
  // (its label, range and doctor question), so the preview never says something the app would not.
  const app = await page.evaluate(() => {
    const cards = buildReportView(analyzeReportTextLocally("Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3\neGFR 44 L mL/min/1.73m2 >60\nLDL Cholesterol 3.6 H mmol/L <3.0"), "en").cards;
    const by = (key) => cards.find((card) => card.key === key) || {};
    return { cre: by("creatinine"), egfr: by("egfr"), ldl: by("ldl") };
  });
  check((await page.innerText("[data-glance-label]")).trim() === app.cre.label, `${size}: the creatinine trend uses the app's label (${app.cre.label})`);
  const asks = await page.$$eval(".fx-ask li", (els) => els.map((el) => el.textContent.trim()));
  check([app.cre.ask, app.ldl.ask, app.egfr.ask].every((ask) => asks.includes(ask)), `${size}: the doctor questions are the app's own`);
  const reel = await page.innerText(".fx-reel");
  check(reel.includes(`eGFR · ${app.egfr.label} · lab's range ${app.egfr.range}`) && reel.includes(`LDL cholesterol · ${app.ldl.label} · lab's range ${app.ldl.range}`), `${size}: hero cards use the app's labels and ranges`);
  check(/Made-up sample results/.test(await page.innerText(".fx-hero")) && /made-up sample report/i.test(await page.innerText("#at-a-glance")), `${size}: the sample results are marked as made up`);
  check(/Planned/.test(await page.innerText("#compare")) && !/\$\s?\d/.test(await page.innerText("#compare")), `${size}: the comparison marks lab testing as planned, with no prices`);
  check((await page.$$("#how-it-works .fx-step")).length === 3, `${size}: three steps`);
  // Tests listed as explained are ones the glossary really covers.
  const listed = await page.$$eval(".fh-area li", (els) => els.map((el) => el.textContent.trim()));
  const glossary = await (await page.request.get(`${base}glossary.html`)).text();
  check(listed.length >= 15 && listed.every((name) => glossary.includes(name)), `${size}: every listed test is in the glossary (${listed.length})`);

  // Trust: does, never, and your data, with links to the policies.
  const safety = await page.innerText("#safety");
  check(/It will/i.test(safety) && /It won't/i.test(safety) && /Your data/i.test(safety) && /Diagnose anything/i.test(safety) && /Recommend medicines or give doses/i.test(safety), `${size}: safety has will / won't / your data`);
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
  check(await page.$('.landing a[href="#early-access-title"]') !== null, `${size}: early access still reachable`);

  // The tour still starts from the demo.
  await page.click("#start-tour");
  check(await page.evaluate(() => document.body.classList.contains("tour-active")), `${size}: "Take the 1-minute tour" starts the tour`);

  if (process.env.AXE_PATH) {
    await page.evaluate(() => typeof endTour === "function" && endTour());
    await page.waitForTimeout(400);
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [[".fh-hero"], ["#at-a-glance"], ["#how-it-works"], ["#compare"], [".ed-why"], ["#explore-reports"], ["#guide"], ["#safety"], ["#for-doctors"], ["#pricing"], ["#faq"], ["footer.ft-footer"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
}
await browser.close();
if (failed) { console.log(`${failed} homepage check(s) failed`); process.exit(1); }
console.log("All homepage checks passed");
