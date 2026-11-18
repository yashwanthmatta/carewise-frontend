// Lab testing page (17 Nov): planned, not available. The page must never look like testing can be
// ordered: no prices, no places to get tested, no named lab partners, and every test marked
// "Planned". "Find testing near you" shows no locations and offers an email through the existing
// early-access list, only with consent.
// Usage: serve the site on :4173, then node scripts/eval/lab-testing.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
for (const [size, viewport] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 800 }], ["small phone", { width: 320, height: 700 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr/, (route) => route.abort());
  const sent = [];
  await context.route(/onrender\.com/, (route) => {
    sent.push({ url: route.request().url(), body: JSON.parse(route.request().postData() || "{}") });
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"accepted":true}' });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}lab-testing.html`, { waitUntil: "load" });
  const text = await page.innerText("main");

  check(/Planned · not available yet/i.test(text) && /Nothing here can be ordered or paid for today/.test(text), `${size}: says plainly that lab testing is planned and can't be ordered`);
  check(!/\$\s?\d/.test(text), `${size}: no prices shown`);
  // 18 Nov redesign: the hero's status card states where things stand, and the main button uses the
  // site's terracotta like every other page.
  const card = await page.innerText(".lt-hero-card");
  check(/Lab partners\s*None signed yet/.test(card) && /Ordering\s*Not available/.test(card) && /Clinician review\s*Planned/.test(card) && /Available now, free/.test(card), `${size}: status card says no partners, no ordering, review planned`);
  check(await page.$eval(".lt-hero .pg-cta", (el) => getComputedStyle(el).backgroundColor) === "rgb(161, 78, 46)", `${size}: main button is the site's terracotta`);
  check(!/\b(Quest|Labcorp|LabCorp)\b/.test(text), `${size}: no lab named as a partner`);
  const tests = await page.$$eval(".lt-test summary small", (list) => list.map((el) => el.textContent.trim()));
  check(tests.length >= 10 && tests.every((label) => label === "Planned"), `${size}: every test is marked Planned (${tests.length})`);
  check(!(await page.$$eval("button, a", (list) => list.some((el) => /^(order|buy|book|add to cart|checkout)/i.test(el.textContent.trim())))), `${size}: no order, buy or book button`);

  await page.fill("#lt-zip-input", "12");
  await page.click("[data-lt-zip] button");
  check(await page.isVisible("[data-lt-zip-error]"), `${size}: a short ZIP code is refused with a message`);
  await page.fill("#lt-zip-input", "78701");
  await page.click("[data-lt-zip] button");
  const none = await page.innerText(".lt-zip-none");
  check(/no partner lab near 78701 yet/.test(none), `${size}: ZIP search says there is no partner lab yet ("${none.slice(0, 50)}…")`);
  check(await page.$$eval(".lt-zip-result address, .lt-zip-result li", (list) => list.length) === 0, `${size}: no locations are listed`);

  await page.fill("#lt-email", "family@example.com");
  await page.click("[data-lt-notify] button");
  check(sent.length === 0 && /tick the box/.test(await page.innerText("[data-lt-notify-status]")), `${size}: nothing is sent without consent`);
  await page.check("[data-lt-notify] input[name=consent]");
  await page.click("[data-lt-notify] button");
  await page.waitForFunction(() => /Thank you/.test(document.querySelector("[data-lt-notify-status]").textContent));
  check(sent.length === 1 && /\/product\/early-access$/.test(sent[0].url) && sent[0].body.consent === true && sent[0].body.note === "Lab testing near ZIP 78701", `${size}: with consent, one early-access signup with the ZIP code`);

  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  await context.close();
}

// The example of clinician-reviewed results: it must say it is an example, never pass a made-up
// review off as real, and keep the clinician's summary apart from the AI explanation.
for (const [size, viewport] of [["desktop", { width: 1440, height: 900 }], ["small phone", { width: 320, height: 700 }]]) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(`${base}lab-results-example.html`, { waitUntil: "load" });
  const banner = await page.innerText(".lr-banner");
  check(/Example with made-up results/.test(banner) && /not available yet/.test(banner) && /No real clinician/.test(banner), `example (${size}): banner says it is made up and not available`);
  const signed = await page.innerText(".lr-signed");
  check(/Example: not a real review/i.test(signed) && /\(made up\)/.test(signed), `example (${size}): the signed summary itself is marked as an example`);
  check(/Written by AI · not reviewed by a clinician/i.test(await page.innerText(".lr-ai")) && !(await page.$(".lr-ai .lr-sign")), `example (${size}): the AI explanation is labelled and carries no signature`);
  check(/First reported as 1\.5 mg\/dL/.test(await page.innerText(".lr-corrected")), `example (${size}): a corrected result keeps the first value`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `example (${size}): no sideways scroll`);
  await context.close();
}

// The homepage links to it.
{
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  check(await page.$$eval('a[href="lab-testing.html"]', (list) => list.length) >= 2, "homepage menu and footer link to Lab testing");
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} lab testing check(s) failed`); process.exit(1); }
console.log("All lab testing checks passed");
