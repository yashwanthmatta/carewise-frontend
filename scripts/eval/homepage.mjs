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

const ORDER = ["fh-hero", "fh-how", "ed-why", "fh-info", "guide", "fh-trust", "fh-doctors", "fh-pricing", "faq"];

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const page = await (await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) })).newPage();
  await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof buildReportView === "function");
  check(/Your lab results came back\. Let's read them together\./.test(await page.innerText("h1")), `${size}: headline`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);

  // One story, in the approved order, with the duplicate sections gone.
  const order = await page.evaluate((names) => [...document.querySelectorAll(".landing > section")]
    .map((node) => names.find((name) => node.classList.contains(name)))
    .filter(Boolean), ORDER);
  check(JSON.stringify(order) === JSON.stringify(ORDER), `${size}: sections in order (${order.join(" > ")})`);
  const removed = await page.evaluate(() => ["#insights", ".lp-problems", ".lp-follow", ".lp-jump", ".lp-hero", ".lp-cards", "#report-story", "#compare", ".fh-final", ".fh-price-grid"].filter((sel) => document.querySelector(sel)));
  check(!removed.length, `${size}: duplicate sections removed ${removed.join(", ")}`);

  // One label for the main action and one for the sample, everywhere on the homepage.
  const toUpload = await page.$$eval('.site-nav .nav-cta, .fh-hero .fh-drop span, .fh-how a[href="#report-title"]', (els) => els.map((el) => (el.getAttribute("aria-label") || el.textContent).replace(/\s+/g, " ").trim()));
  check(toUpload.length >= 3 && toUpload.every((label) => label === "Understand my report"), `${size}: one main action label (${[...new Set(toUpload)].join(" | ")})`);
  const sample = await page.$$eval(".landing [data-try-sample]", (els) => els.map((el) => el.textContent.trim()));
  check(sample.length >= 1 && sample.every((label) => label === "Try a sample report"), `${size}: one sample label (${[...new Set(sample)].join(" | ")})`);
  check(await page.$eval(".fh-hero", (hero) => hero.getAnimations({ subtree: true }).length) === 0, `${size}: the hero does not animate`);
  // Header links go to real parts of the page.
  const links = await page.$$eval(".fh-site-links a", (els) => els.map((a) => [a.textContent.trim(), Boolean(document.querySelector(a.getAttribute("href")))]));
  check(links.length === 4 && links.every(([, exists]) => exists), `${size}: header links reach real sections (${links.map(([t]) => t).join(", ")})`);
  check(!/Explain a report, free/.test(await page.innerText("main")), `${size}: no leftover "Explain a report, free"`);

  // The hero's handwritten notes are the app's own words for these exact numbers.
  const app = await page.evaluate(() => {
    const cards = buildReportView(analyzeReportTextLocally("Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3\neGFR 28 L mL/min/1.73m2 >60"), "en").cards;
    const by = (key) => cards.find((card) => card.key === key) || {};
    return { cre: by("creatinine"), egfr: by("egfr") };
  });
  const notes = await page.$$eval(".fh-preview [data-note]", (els) => Object.fromEntries(els.map((el) => [el.dataset.note, el.textContent.replace(/\s+/g, " ").trim()])));
  check(notes.cre === `Creatinine 2.3: ${String(app.cre.label).toLowerCase()} (${app.cre.range})`, `${size}: creatinine note is the app's label and range (${notes.cre})`);
  check(notes.egfr === `eGFR 28: ${String(app.egfr.label).toLowerCase()} (${app.egfr.range})`, `${size}: eGFR note is the app's label and range (${notes.egfr})`);
  check((await page.innerText(".fh-preview .ed-ask")).includes(app.cre.ask), `${size}: the doctor question is the app's own`);
  check(/How are my kidneys working/.test(await page.innerText(".fh-preview")), `${size}: hero preview shows a kidney question`);
  // Each pen circle is drawn around its own value: the loop's centre is on that value's cell.
  await page.waitForTimeout(300);
  const marks = await page.evaluate(() => {
    const wrap = document.querySelector("[data-annotated]").getBoundingClientRect();
    const path = document.querySelector("[data-ink] path")?.getAttribute("d") || "";
    const loops = [...path.matchAll(/M(-?[\d.]+) (-?[\d.]+) C(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)/g)].map((m) => m.slice(1).map(Number));
    return ["cre", "egfr"].map((key, i) => {
      const cell = document.querySelector(`[data-mark="${key}"]`);
      const c = cell.getBoundingClientRect();
      const loop = loops[i];
      if (!loop) return [key, cell.textContent.trim(), false];
      const cx = (loop[0] + loop[6]) / 2 + wrap.left;
      const cy = loop[1] + wrap.top;
      return [key, cell.textContent.trim(), cx >= c.left - 30 && cx <= c.right + 30 && cy >= c.top - 16 && cy <= c.bottom + 16];
    });
  });
  check(marks.length === 2 && marks[0][1] === "2.3" && marks[1][1] === "28" && marks.every(([, , inside]) => inside), `${size}: each pen circle sits on its own value (${marks.map(([k, v, ok]) => `${k} ${v} ${ok}`).join(", ")})`);
  check((await page.$$("#how-it-works .fh-step")).length === 3, `${size}: three steps`);
  // Tests listed as explained are ones the glossary really covers.
  const listed = await page.$$eval(".fh-area li", (els) => els.map((el) => el.textContent.trim()));
  const glossary = await (await page.request.get(`${base}glossary.html`)).text();
  check(listed.length >= 15 && listed.every((name) => glossary.includes(name)), `${size}: every listed test is in the glossary (${listed.length})`);

  // Trust: does, never, and your data, with links to the policies.
  const safety = await page.innerText("#safety");
  check(/It will/i.test(safety) && /It won't/i.test(safety) && /Your data/i.test(safety) && /Diagnose anything/i.test(safety) && /Name medicines or doses/i.test(safety), `${size}: safety has will / won't / your data`);
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
    const violations = await page.evaluate(async () => (await axe.run({ include: [[".fh-hero"], ["#how-it-works"], [".ed-why"], ["#explore-reports"], ["#guide"], ["#safety"], ["#for-doctors"], ["#pricing"], ["#faq"], ["footer.ft-footer"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
}
await browser.close();
if (failed) { console.log(`${failed} homepage check(s) failed`); process.exit(1); }
console.log("All homepage checks passed");
