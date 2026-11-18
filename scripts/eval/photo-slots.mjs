// Photo slots (18 Nov 2026). The homepage has places for illustrative photographs of people.
// A photo appears only when assets/photos/photos.json lists it; until then each slot shows its
// product illustration, never a placeholder. Every photo shown carries a visible disclosure, the
// hero photo loads first and the others lazily, and a missing file falls back to the illustration.
// The photos here are plain test images served by the test itself; no real photo is involved.
// Usage: serve the site on :4173, then node scripts/eval/photo-slots.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };
const SLOTS = ["hero", "lab", "clinician", "reminders"];
const NOTE = "Illustrative AI-generated image. Not an actual FollowThrough patient or clinician.";

const browser = await chromium.launch();
// A plain grey test image, made here.
const maker = await browser.newPage({ viewport: { width: 400, height: 300 } });
await maker.setContent('<body style="margin:0;background:#9a8f80"></body>');
const testImage = await maker.screenshot({ type: "jpeg" });
await maker.close();

async function open(viewport, manifest, { brokenSlot } = {}) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
  const photoRequests = [];
  await context.route(/assets\/photos\//, (route) => {
    const url = route.request().url();
    if (/photos\.json/.test(url)) {
      return manifest ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(manifest) }) : route.continue();
    }
    photoRequests.push(url);
    if (brokenSlot && url.includes(`/test-${brokenSlot}-`)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: "image/jpeg", body: testImage });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  return { context, page, errors, photoRequests };
}

// 1. As shipped: no photos listed, so every slot shows its illustration and nothing is requested.
{
  const { context, page, errors, photoRequests } = await open({ width: 1440, height: 900 });
  const state = await page.$$eval("[data-photo-slot]", (els) => els.map((el) => [el.dataset.photoSlot, el.classList.contains("has-photo"), !!el.querySelector(".fx-photo")]));
  check(SLOTS.every((slot) => state.some(([name]) => name === slot)), `every planned slot is on the page (${state.map(([n]) => n).join(", ")})`);
  check(state.every(([, has, fig]) => !has && !fig), "with no photos listed, no slot shows a photo or a placeholder");
  check(photoRequests.length === 0, "no image files are requested when none are listed");
  check(await page.isVisible(".fx-reel") && await page.isVisible(".fx-art-lab") && await page.isVisible(".fx-art-review") && await page.isVisible(".fx-art-remind"), "each slot shows its product illustration");
  check(!errors.length, `no script errors ${errors.join("; ")}`);
  await context.close();
}

// 2. With photos listed (test images): they appear with the disclosure, load sensibly and fit.
const manifest = { photos: SLOTS.map((slot) => ({ slot, base: `assets/photos/test-${slot}`, widths: [800, 1600], formats: ["jpg"], width: 1600, height: 1000, alt: `Test image for the ${slot} slot` })) };
for (const [size, viewport] of [["desktop", { width: 1440, height: 900 }], ["tablet", { width: 768, height: 1024 }], ["phone", { width: 390, height: 844 }], ["small phone", { width: 320, height: 700 }]]) {
  const { context, page, errors } = await open(viewport, manifest);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(400);
  const slots = await page.$$eval("[data-photo-slot]", (els) => els.map((el) => {
    const img = el.querySelector(".fx-photo img");
    return { slot: el.dataset.photoSlot, has: el.classList.contains("has-photo"), note: el.querySelector(".fx-photo-note")?.textContent || "", loading: img?.loading, priority: img?.getAttribute("fetchpriority"), alt: img?.alt || "", w: img?.getBoundingClientRect().width || 0 };
  }));
  check(slots.every((s) => s.has), `${size}: every listed photo is shown (${slots.filter((s) => !s.has).map((s) => s.slot).join(", ") || "all"})`);
  check(slots.every((s) => s.note === NOTE), `${size}: every photo carries the AI-image disclosure`);
  check(slots.every((s) => s.alt.length > 0), `${size}: every photo has alt text`);
  const hero = slots.find((s) => s.slot === "hero");
  check(hero.loading === "eager" && hero.priority === "high" && slots.filter((s) => s.slot !== "hero").every((s) => s.loading === "lazy"), `${size}: the hero photo loads first, the others lazily`);
  check(!(await page.isVisible(".fx-reel")) && await page.isVisible(".fx-stage-card") && /Made-up sample result/.test(await page.innerText(".fx-stage-card")), `${size}: with a hero photo, one made-up sample result sits on it`);
  check(!(await page.isVisible(".fx-art-lab")), `${size}: a photo replaces its illustration`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  check(slots.every((s) => s.w > 200 && s.w <= viewport.width), `${size}: photos fit the screen (${slots.map((s) => Math.round(s.w)).join(", ")})`);
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  await context.close();
}

// 3. A listed photo whose file is missing falls back to the illustration.
{
  const { context, page } = await open({ width: 1440, height: 900 }, manifest, { brokenSlot: "lab" });
  await page.locator("#lab-testing").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  check(!(await page.$eval("[data-photo-slot=lab]", (el) => el.classList.contains("has-photo") || !!el.querySelector(".fx-photo"))) && await page.isVisible(".fx-art-lab"), "a missing photo file falls back to the illustration");
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} photo slot check(s) failed`); process.exit(1); }
console.log("All photo slot checks passed");
