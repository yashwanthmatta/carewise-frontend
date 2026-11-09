// Premium homepage sections (2026-11-09): the "Watch it work" animated report, the FAQ accordion and
// the comparison table. Checks the six steps (by button and by playing), that the sample numbers
// and the app's own words are shown exactly, that the chart is drawn to scale, keyboard use of the
// FAQ, reduced motion, phone layout and accessibility.
// Optional: AXE_PATH=/path/to/axe.min.js. Usage: serve the site on :4173, then node scripts/eval/landing-premium.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };
const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 740 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "load" });
  const step = () => page.$eval(".story-canvas", (el) => el.dataset.step);
  check(await step() === "1", `${size}: the demo starts at step 1`);
  // It plays only once on screen.
  await page.waitForTimeout(3000);
  check(await step() === "1", `${size}: it does not play while out of view`);
  await page.$eval("#report-story", (el) => el.scrollIntoView());
  await page.waitForFunction(() => document.querySelector(".story-canvas").dataset.step !== "1", null, { timeout: 6000 }).catch(() => {});
  check(await step() !== "1", `${size}: it plays once in view`);
  await page.click('[data-story-step="3"]');
  check(await step() === "3" && await page.getAttribute("[data-story-play]", "aria-pressed") === "false", `${size}: choosing a step shows it and pauses`);
  await page.waitForTimeout(3000);
  check(await step() === "3", `${size}: paused stays on the chosen step`);
  const view = await page.evaluate(() => {
    const v = buildReportView(analyzeReportTextLocally("Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3"), "en").tests[0];
    return { meaning: v.meaning, ask: v.ask, label: v.label };
  });
  const cards = await page.evaluate(() => document.querySelector(".story-cards").textContent.replace(/\s+/g, " "));
  check(cards.includes(view.meaning) && cards.includes(view.ask) && cards.includes(view.label), `${size}: the explanation, question and label are the app's own words`);
  check(/2\.3/.test(cards) && /mg\/dL/.test(cards) && /0\.6-1\.3/.test(cards), `${size}: exact number, unit and range`);
  const chart = await page.evaluate(() => {
    const y = (v) => 125 - v * 32;
    const band = document.querySelector(".story-band");
    const top = Number(band.getAttribute("y"));
    const bottom = top + Number(band.getAttribute("height"));
    const pts = document.querySelector(".story-line").getAttribute("points").split(" ").map((p) => Number(p.split(",")[1]));
    return Math.abs(top - y(1.3)) < 0.05 && Math.abs(bottom - y(0.6)) < 0.05 && [1.4, 1.9, 2.3].every((v, i) => Math.abs(pts[i] - y(v)) < 0.05);
  });
  check(chart, `${size}: chart points and range band are drawn to scale`);
  check(/made-up numbers/.test(cards), `${size}: the history says its numbers are made up`);

  // FAQ
  const faq = page.locator("#faq-q-4");
  await faq.scrollIntoViewIfNeeded();
  check(await faq.getAttribute("aria-expanded") === "false" && !(await page.isVisible("#faq-a-4 p")), `${size}: FAQ answers start closed`);
  await faq.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
  check(await faq.getAttribute("aria-expanded") === "true" && /not a doctor/.test(await page.innerText("#faq-a-4")), `${size}: Enter opens "Is the AI Health Guide a real doctor?"`);
  await page.click("#faq-q-6");
  await page.waitForTimeout(450);
  check(await faq.getAttribute("aria-expanded") === "false" && await page.getAttribute("#faq-q-6", "aria-expanded") === "true", `${size}: opening another closes the first`);
  check((await page.$$("#faq .faq-item")).length === 9, `${size}: nine questions`);
  // Comparison
  const cmp = await page.innerText("#compare");
  check(/FollowThrough Health vs\./.test(cmp) && (await page.$$("#compare tbody tr")).length === 7 && !/\$|\d+\+/.test(cmp), `${size}: comparison has 7 rows, no prices or counts`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  if (process.env.AXE_PATH) {
    await page.waitForTimeout(600);
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [["#report-story"], ["#faq"], ["#compare"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
  await context.close();
}
// Reduced motion: no autoplay, every step shown.
{
  const context = await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await page.$eval("#report-story", (el) => el.scrollIntoView());
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => ({ step: document.querySelector(".story-canvas").dataset.step, opacity: getComputedStyle(document.querySelector(".story-card-6")).opacity, hero: getComputedStyle(document.querySelector(".lp-mock-hero .lp-ask")).animationName }));
  check(state.step === "6" && state.opacity === "1", "reduced motion: everything shown at once, nothing plays");
  check(state.hero === "none", "reduced motion: hero preview does not animate");
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} premium homepage check(s) failed`); process.exit(1); }
console.log("All premium homepage checks passed");
