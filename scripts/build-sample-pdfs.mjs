// Turns the made-up demo reports in assets/samples/*.txt into PDFs that visitors can
// download and upload on the site, so the public demo uses the real upload path.
// Usage: node scripts/build-sample-pdfs.mjs   (needs Playwright's Chromium)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "samples");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const css = "body{font-family:Arial,sans-serif;font-size:11pt;color:#111;margin:40px} h1{font-size:15pt;margin:0 0 4px} .meta{font-size:9pt;color:#444;margin:0 0 14px} .banner{border:2px solid #b42318;color:#b42318;font-weight:700;padding:6px 10px;margin:0 0 16px;font-size:10pt} h2{font-size:11pt;margin:16px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px} p{margin:3px 0}";
const browser = await chromium.launch();
const page = await browser.newPage();
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".txt"));
for (const name of files) {
  const lines = fs.readFileSync(path.join(dir, name), "utf8").trim().split("\n");
  const scan = /^CT |^MRI /.test(lines[0]);
  const body = lines.map((line) => (/^[A-Z][A-Z ,]+:?$/.test(line) ? `<h2>${esc(line)}</h2>` : `<p>${esc(line)}</p>`)).join("");
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><p class="banner">SAMPLE REPORT. Made-up person, not real patient data. For trying FollowThrough Health only.</p><h1>${scan ? "Sample Imaging Center" : "Sample Clinical Laboratory"}</h1><p class="meta">Collected: 10/01/2026 &nbsp; Reported: 10/02/2026</p>${body}</body></html>`);
  await page.pdf({ path: path.join(dir, name.replace(/\.txt$/, ".pdf")), format: "Letter" });
}
await browser.close();
console.log(`Built ${files.length} sample PDFs in ${dir}`);
