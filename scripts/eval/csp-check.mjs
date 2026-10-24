// The production Content-Security-Policy must not break the site. Walks every page and the flows
// that load code or data in unusual ways (PDF reader, photo reader, doctor brief window, guided
// tour, doctor demo, glossary search, demo checklist) and fails on any CSP violation.
// Usage: python3 scripts/serve_with_headers.py 4174 & node scripts/eval/csp-check.mjs
//        CAREWISE_CSP_URL=http://localhost:4173/ node scripts/eval/csp-check.mjs   (plain server, meta only)
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_CSP_URL || "http://127.0.0.1:4174/";
const violations = [];
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
// The page under test must never reach the real API from CI.
await context.route(/carewise-api\.onrender\.com/, (route) => route.fulfill({ status: 503, body: "{}", contentType: "application/json" }));
await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, body: "" }));
await context.addInitScript(() => {
  document.addEventListener("securitypolicyviolation", (event) => {
    console.error(`CSP-VIOLATION ${event.violatedDirective} ${event.blockedURI || "inline"} @ ${location.pathname}`);
  });
});
const watch = (page) => page.on("console", (message) => {
  const text = message.text();
  if (/CSP-VIOLATION|Content Security Policy/.test(text)) violations.push(text);
});
context.on("page", watch);

// 1. Every page loads with the policy (headers present).
const pages = ["", "demo.html", "faq.html", "safety.html", "about.html", "support.html", "accessibility.html", "glossary.html", "packet.html", "share.html",
  "legal/privacy.html", "legal/terms.html", "legal/disclaimer.html", "legal/data-deletion.html", "legal/security.html", "legal/app-store-disclosures.html"];
const page = await context.newPage();
for (const path of pages) {
  const response = await page.goto(base + path, { waitUntil: "load" });
  // Production serves the policy in a <meta> tag (the host doesn't apply render.yaml headers);
  // either way, the page must carry it.
  const viaHeader = /default-src 'self'/.test(response.headers()["content-security-policy"] || "");
  const viaMeta = await page.evaluate(() => /default-src 'self'/.test(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || ""));
  ok(viaHeader || viaMeta, `${path || "/"} carries the policy (${[viaHeader && "header", viaMeta && "meta"].filter(Boolean).join(" + ")})`);
}

// 1b. The policy is enforced, not just present: an injected inline script must not run.
await page.goto(base, { waitUntil: "load" });
const injected = await page.evaluate(() => {
  const el = document.createElement("script");
  el.textContent = "window.__cspInjected = true";
  document.body.appendChild(el);
  return window.__cspInjected === true;
});
ok(!injected, "an injected inline script is blocked");
await page.waitForTimeout(500); // the violation report arrives asynchronously
violations.splice(0); // that block is the expected violation

// 2. Explain a pasted report, then open the doctor brief window (written into a new tab).
await page.goto(base, { waitUntil: "load" });
await page.waitForFunction(() => typeof showOcrResult === "function" && typeof window.showCareWiseSection === "function");
await page.evaluate(() => window.showCareWiseSection("report-title", false));
await page.fill("#report-text", "Sample Lab\nLDL cholesterol 148 mg/dL <100\nHDL cholesterol 52 mg/dL >40\nA1C 5.4 % 4.0-5.6");
await page.click("#analyze-report");
await page.waitForSelector("#report-results .report-summary");
const [brief] = await Promise.all([
  context.waitForEvent("page"),
  page.locator('[data-report-action="doctor-brief"]').first().evaluate((el) => el.click()),
]);
await brief.waitForLoadState();
ok(/Patient questions/.test(await brief.content()), "doctor brief window opens with its content");
ok(await brief.evaluate(() => !document.querySelector("[onclick]") && !!document.querySelector("[data-brief-print]")), "brief print button has no inline handler");
await brief.close();

// 3. PDF upload (PDF.js served from this site).
await page.goto(base + "#report-title", { waitUntil: "load" });
await page.setInputFiles("#report-file", "scripts/eval/pdfs/a1c-normal.pdf");
await page.waitForFunction(() => /A1C|HbA1c/i.test(document.querySelector("#report-text").value), null, { timeout: 30000 }).catch(() => {});
ok(/A1C|HbA1c/i.test(await page.inputValue("#report-text")), "a PDF report is read into the text box");

// 4. Photo upload (Tesseract with WebAssembly, served from this site).
const shot = await browser.newPage({ viewport: { width: 900, height: 260 } });
await shot.setContent('<body style="margin:0;background:#fff;font:34px Arial;padding:24px">Sample Lab<br>Sodium 140 mmol/L 135-145<br>Potassium 4.1 mmol/L 3.5-5.1</body>');
const png = await shot.screenshot();
await shot.close();
await page.goto(base + "#report-title", { waitUntil: "load" });
await page.setInputFiles("#report-file", { name: "sample-report.png", mimeType: "image/png", buffer: png });
await page.waitForFunction(() => /Sodium/i.test(document.querySelector("#report-text").value), null, { timeout: 90000 }).catch(() => {});
ok(/Sodium/i.test(await page.inputValue("#report-text")), "a photo of a report is read on the device");

// 5. Guided tour, including the doctor brief preview frame.
await page.goto(base + "#tour", { waitUntil: "load" });
await page.waitForTimeout(800);
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(700);
  if (await page.locator("#tour-next").isVisible()) await page.click("#tour-next");
}
ok(true, "guided tour stepped through");

// 6. Doctor demo straight from the shared link.
await page.goto("about:blank");
await page.goto(base + "#doctor-demo", { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector("#db-demo-banner") && !document.querySelector("#db-demo-banner").hidden, null, { timeout: 10000 }).catch(() => {});
ok(await page.evaluate(() => !document.querySelector("#db-demo-banner").hidden && document.querySelector("#db-patient-ref").value === "REF-1042"), "#doctor-demo opens the doctor demo with a sample lab");

// 7. Pages whose script moved out of the HTML.
await page.goto(base + "glossary.html", { waitUntil: "load" });
const total = await page.locator(".gl-item").count();
await page.fill("#gl-q", "cholesterol");
await page.waitForTimeout(200);
const shown = await page.locator(".gl-item:not([hidden])").count();
ok(shown > 0 && shown < total, `glossary search filters (${shown} of ${total})`);
await page.goto(base + "demo.html", { waitUntil: "load" });
await page.check("#dm-1");
ok(/^1 of/.test(await page.textContent("#dm-progress")), "demo checklist counts progress");

await browser.close();
ok(violations.length === 0, `no Content-Security-Policy violations${violations.length ? ":\n  " + [...new Set(violations)].join("\n  ") : ""}`);
if (failures) {
  console.error(`${failures} CSP check(s) failed`);
  process.exit(1);
}
console.log("All CSP checks passed");
