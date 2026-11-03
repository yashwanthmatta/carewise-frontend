// Clinic self-pay prices and visit summary sections, in the doctor demo (no server, no sign-in):
// prices only ever come from the clinic and are labelled as such; hidden sections stay hidden.
// Usage: serve the site on :4173, then node scripts/eval/visit-settings-demo.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };
const browser = await chromium.launch();
const errors = [];
for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (e) => errors.push(String(e)));
  const calls = [];
  page.on("request", (r) => { if (/\/clinics/.test(new URL(r.url()).pathname) && !r.url().startsWith(base)) calls.push(r.url()); });
  await page.goto(`${base}#doctor-demo`, { waitUntil: "load" });
  await page.waitForFunction(() => !document.querySelector("#db-demo-banner").hidden, null, { timeout: 10000 });
  await page.locator("#db-settings summary").click();
  await page.click("#db-price-known");
  await page.locator("#db-price-rows .db-price-row").filter({ has: page.locator('[data-price-cpt][value="80061"]') }).locator("[data-price-usd]").fill("24.5");
  await page.uncheck('[data-visit-show="agenda"]');
  await page.click("#db-visit-form button[type=submit]");
  await page.waitForTimeout(300);
  ok(/saved, with 1 self-pay price/.test(await page.textContent("#db-status")), `[${viewport.width}] settings saved in the demo`);
  await page.click("#db-draft");
  await page.waitForTimeout(800);
  await page.click("#db-approve");
  await page.waitForTimeout(800);
  await page.locator("[data-db-visit]").first().click();
  await page.waitForTimeout(500);
  const visit = (await page.innerText("#db-visit")).replace(/\s+/g, " ");
  ok(/Lipid panel: CPT 80061 · your clinic's self-pay price \$24\.50/.test(visit), `[${viewport.width}] the clinic's price shows next to its code`);
  ok(/Not a quote from the lab or an insurer/.test(visit), `[${viewport.width}] the price is labelled as not a quote`);
  ok(!/Suggested visit agenda/.test(visit) && /1 section hidden/.test(visit), `[${viewport.width}] the hidden section stays hidden and the summary says so`);
  ok(!/\$\d/.test(visit.replace(/your clinic's self-pay price \$24\.50/g, "")), `[${viewport.width}] no other price appears anywhere`);
  await page.locator('[data-visit-block="told"] [data-db-hide-block]').click();
  ok(!(await page.locator('[data-visit-block="told"]').count()), `[${viewport.width}] a section can be hidden for this view`);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `[${viewport.width}] no sideways scroll`);
  ok(calls.length === 0, `[${viewport.width}] the demo made no clinic server calls`);
  await page.close();
}
await browser.close();
ok(errors.length === 0, `no page errors ${JSON.stringify(errors)}`);
if (failures) { console.error(`${failures} visit settings check(s) failed`); process.exit(1); }
console.log("All visit settings checks passed");
