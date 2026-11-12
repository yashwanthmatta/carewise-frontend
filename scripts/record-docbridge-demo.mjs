// Records the DocBridge doctor demo for the homepage video (assets/video/doctor-demo.*).
// Made-up clinic and sample labs only. The local build is served under the public domain so the
// patient link in the recording reads followthroughhealth.com.
// Usage: serve the site on :4173, then node scripts/record-docbridge-demo.mjs [outDir]
// Then encode, for example:
//   ffmpeg -i <out>.webm -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an assets/video/doctor-demo.mp4
//   ffmpeg -i <out>.webm -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -an assets/video/doctor-demo.webm
//   ffmpeg -ss 9 -i <out>.webm -frames:v 1 -q:v 4 assets/video/doctor-demo-poster.jpg
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const OUT = process.argv[2] || "video-out";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: "block", recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } });
await ctx.route(/onrender\.com/, (r) => r.abort());
// Serve the local build under the public domain so the patient link reads followthroughhealth.com.
await ctx.route("https://followthroughhealth.com/**", async (route) => {
  const u = new URL(route.request().url());
  const res = await fetch("http://localhost:4173" + u.pathname + u.search);
  route.fulfill({ status: res.status, headers: { "content-type": res.headers.get("content-type") || "text/html" }, body: Buffer.from(await res.arrayBuffer()) });
});
const p = await ctx.newPage();
const caption = (text) => p.evaluate((text) => {
  let c = document.getElementById("rec-caption");
  if (!c) { c = document.createElement("div"); c.id = "rec-caption"; document.body.appendChild(c);
    Object.assign(c.style, { position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)", zIndex: 99999, maxWidth: "820px", padding: "12px 22px", borderRadius: "14px", background: "rgba(41,41,41,0.92)", color: "#fff", font: "500 20px/1.35 'DM Sans', system-ui, sans-serif", textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,.18)" }); }
  c.textContent = text;
  const help = document.querySelector(".lp-chat-toggle, .lp-chat-launcher, [aria-label^='Need help']"); if (help) help.style.visibility = "hidden";
}, text);
const smooth = (y) => p.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), y);
const topOf = (sel, offset = 110) => p.evaluate(([sel, offset]) => document.querySelector(sel).getBoundingClientRect().top + scrollY - offset, [sel, offset]);
const wait = (ms) => p.waitForTimeout(ms);

await p.goto("https://followthroughhealth.com/#doctor-demo", { waitUntil: "load" });
await p.waitForFunction(() => !document.querySelector("#db-demo-banner").hidden);
await wait(600);
await caption("1. A lab arrives. Made-up clinic, sample results.");
await smooth(await topOf("#db-text", 200)); await wait(3200);

await p.click("#db-draft");
await caption("2. A draft explanation appears, with every value from the lab.");
await wait(500); await smooth(await topOf("#db-values")); await wait(3800);
await caption("2. The automatic draft stays on the left. The clinician edits on the right.");
await smooth(await topOf("#db-summary", 160)); await wait(3200);

await caption("3. The clinician changes any word, in their own voice.");
await p.evaluate(() => { const t = document.querySelector("#db-summary"); const i = t.value.indexOf("If you have questions"); t.focus(); t.setSelectionRange(i, i); t.scrollTop = t.scrollHeight; });
await p.keyboard.type("We'll recheck your A1C at your next visit. ", { delay: 45 });
await wait(1500);

await caption("4. Approve: the patient gets a private link.");
await p.click("#db-approve"); await wait(600);
await smooth(await topOf("#db-email-patient", 260)); await wait(4200);

const link = await p.evaluate(() => [...document.querySelectorAll(".docbridge-panel input")].map((i) => i.value).find((v) => v.includes("packet.html")));
await p.goto(link, { waitUntil: "load" }); await wait(300);
await caption("5. What the patient sees.");
await wait(3000); await smooth(500); await wait(3000); await smooth(1100); await wait(3200);

const video = p.video(); await ctx.close(); console.log(await video.path());
await b.close();
