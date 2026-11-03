// Browser check of the DEPLOYED website: is the latest code live, do the pages load cleanly on
// desktop and phone, do the sample-report flow, doctor demo and demo video work.
// Read-only: it never signs in or saves anything; the doctor demo runs entirely in the browser.
// Usage: CAREWISE_LIVE_URL=https://followthroughhealth.com/ node scripts/eval/live-site.mjs
import { readFileSync } from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = (process.env.CAREWISE_LIVE_URL || "https://followthroughhealth.com/").replace(/\/?$/, "/");
const inCi = Boolean(process.env.GITHUB_ACTIONS);
let failures = 0;
const ok = (cond, message, detail = "") => {
  if (!cond) failures += 1;
  console.log(`${cond ? "ok  " : "FAIL"} ${message}${!cond && detail ? ` (${detail})` : ""}`);
  if (inCi && !cond) console.log(`::error::Live site: ${message}${detail ? ` (${detail})` : ""}`);
};

const browser = await chromium.launch();
const errors = [];

// 1. The deployed code is the code in this commit.
const expected = readFileSync(new URL("../../sw.js", import.meta.url), "utf8").match(/carewise-product-\d+/)[0];
const probe = await browser.newPage();
const sw = await (await probe.request.get(`${base}sw.js?nocache=${Date.now()}`)).text();
const live = (sw.match(/carewise-product-\d+/) || ["none"])[0];
ok(live === expected, `deployed version is the latest (${live})`, `expected ${expected}`);
await probe.close();

// 2. Every page: loads, no script errors, nothing wider than the screen, at desktop and phone size.
const pages = ["", "demo.html", "faq.html", "safety.html", "about.html", "support.html", "accessibility.html", "glossary.html",
  "legal/privacy.html", "legal/terms.html", "legal/disclaimer.html", "legal/data-deletion.html", "legal/security.html"];
for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  const bad = [];
  for (const path of pages) {
    const response = await page.goto(base + path, { waitUntil: "load" });
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (!response || response.status() !== 200 || wide) bad.push(`${path || "/"}: ${response?.status()}${wide ? " too wide" : ""}`);
  }
  ok(bad.length === 0, `[${viewport.width}px] all ${pages.length} pages load and fit the screen`, bad.join(", "));
  await ctx.close();
}

// 3. Sample-report flow on a phone: one tap from the demo page to an explained report and doctor brief.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`sample flow: ${e.message}`));
  await page.goto(`${base}demo.html`, { waitUntil: "load" });
  const [app] = await Promise.all([ctx.waitForEvent("page"), page.click('a[href="/#try=raj-kidney-heart-uk"]')]);
  app.on("pageerror", (e) => errors.push(`sample flow: ${e.message}`));
  await app.waitForFunction(() => document.querySelector("#report-text")?.value.includes("Raj, 78"), null, { timeout: 15000 }).catch(() => {});
  await app.click("#analyze-report").catch(() => {});
  await app.waitForSelector("#report-results .report-summary", { timeout: 15000 }).catch(() => {});
  const result = (await app.textContent("#report-results").catch(() => "")).replace(/\s+/g, " ");
  ok(/outside the lab's ranges/.test(result), "sample report from the demo page is explained");
  const [brief] = await Promise.all([ctx.waitForEvent("page", { timeout: 10000 }).catch(() => null),
    app.locator('[data-report-action="doctor-brief"]').first().click().catch(() => {})]);
  ok(Boolean(brief) && /Patient questions/.test(await brief.content()), "doctor brief opens");
  const [download] = await Promise.all([app.waitForEvent("download", { timeout: 10000 }).catch(() => null),
    app.locator('[data-report-action="packet-pdf"]').first().click().catch(() => {})]);
  ok(Boolean(download) && /\.pdf$/.test(download.suggestedFilename()), "PDF for the doctor downloads");
  await ctx.close();
}

// 4. Doctor demo from the shared link: draft, approve, patient link, visit summary.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`doctor demo: ${e.message}`));
  await page.goto(`${base}#doctor-demo`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#db-demo-banner") && !document.querySelector("#db-demo-banner").hidden, null, { timeout: 15000 }).catch(() => {});
  ok(await page.evaluate(() => !document.querySelector("#db-demo-banner")?.hidden), "#doctor-demo opens the doctor demo");
  await page.click("#db-draft").catch(() => {});
  await page.waitForTimeout(1000);
  await page.click("#db-approve").catch(() => {});
  await page.waitForTimeout(1000);
  ok(/Approved by Dr\. Sample/.test(await page.textContent("#db-status").catch(() => "")), "demo draft is approved");
  ok(/packet\.html#demo=/.test(await page.inputValue("#db-link-url").catch(() => "")), "demo produces a patient link");
  await page.locator("[data-db-visit]").first().click().catch(() => {});
  await page.waitForTimeout(600);
  ok(/Visit summary/.test(await page.textContent("#db-visit").catch(() => "")), "visit summary opens");
  await ctx.close();
}

// 5. The demo video loads and actually plays.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(base, { waitUntil: "load" });
  const video = await page.evaluate(async () => {
    const v = document.querySelector("#for-doctors video");
    if (!v) return { found: false };
    v.preload = "auto";
    v.load();
    await new Promise((resolve) => { v.addEventListener("loadedmetadata", resolve, { once: true }); setTimeout(resolve, 15000); });
    const start = v.currentTime;
    await v.play().catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return { found: true, src: v.currentSrc.split("/").pop(), duration: Math.round(v.duration || 0), width: v.videoWidth, advanced: v.currentTime > start, error: v.error?.code || 0 };
  });
  ok(video.found && video.duration > 0 && video.width > 0, `demo video loads (${video.src || "none"}, ${video.duration || 0}s, ${video.width || 0}px wide)`, video.error ? `media error ${video.error}` : "");
  ok(video.advanced, "demo video plays");
  await page.close();
}

await browser.close();
ok(errors.length === 0, "no script errors on the live site", errors.slice(0, 5).join(" | "));
if (inCi) console.log(`::notice::Live browser check of ${base}: ${failures ? `${failures} problem(s)` : "everything passed"}`);
if (failures) {
  console.error(`${failures} live check(s) failed`);
  process.exit(1);
}
console.log("All live checks passed");
