// Homepage parts people interact with (rebuilt 2026-11-13): the questions list and the pricing table.
// The animated "Watch it work" demo and the comparison table were removed in the rebuild (they read as
// a template); the hero's notes are checked against the app's own words in homepage.mjs instead.
// Checks: FAQ keyboard use and one-open-at-a-time, nine questions; pricing shows each plan once with
// the same prices the FAQ states and working plan buttons; no sideways scroll; no script errors.
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
  // Pricing: three plans, each price stated once, the same prices the FAQ gives, buttons wired.
  const plans = await page.$$eval("#pricing tbody tr", (rows) => rows.map((row) => [row.querySelector("th").textContent.trim(), row.querySelector(".ed-amount").textContent.replace(/\s+/g, " ").trim()]));
  check(JSON.stringify(plans) === JSON.stringify([["Free", "$0"], ["Plus", "$7 a month"], ["Family", "$12 a month"]]), `${size}: pricing rows (${plans.map((p) => p.join(" ")).join(", ")})`);
  const faqPrices = await page.textContent("#faq-a-7");
  check(/\$7 a month/.test(faqPrices) && /\$12 a month/.test(faqPrices), `${size}: FAQ prices match the table`);
  check(await page.$$eval("#pricing [data-choose-plan]", (links) => links.map((a) => a.dataset.choosePlan).join(",")) === "plus,family", `${size}: plan buttons for Plus and Family`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  if (process.env.AXE_PATH) {
    await page.waitForTimeout(600);
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [["#faq"], ["#pricing"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} homepage interaction check(s) failed`); process.exit(1); }
console.log("All homepage interaction checks passed");
