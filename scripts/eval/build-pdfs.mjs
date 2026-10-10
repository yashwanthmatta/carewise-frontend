// Renders every case in cases.json into a realistic lab-report PDF (scripts/eval/pdfs).
// Usage: node scripts/eval/build-pdfs.mjs   (needs Playwright's Chromium)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Uses the project copy of Playwright when installed (CI), else the machine-wide one.
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));

const dir = path.dirname(fileURLToPath(import.meta.url));
const { reports } = JSON.parse(fs.readFileSync(path.join(dir, "cases.json"), "utf8"));
const out = path.join(dir, "pdfs");
fs.mkdirSync(out, { recursive: true });
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const header = (title) => `<h1>Sample Clinical Laboratory</h1><p class="meta">Patient: TEST, SAMPLE &nbsp; DOB: 01/01/1960 &nbsp; Collected: 10/01/2026 08:12 &nbsp; Reported: 10/02/2026</p><h2>${esc(title)}</h2>`;
const layouts = {
  table: (r) => `<table><tr><th>Test</th><th>Result</th><th>Flag</th><th>Units</th><th>Reference Range</th></tr>${r.tests.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.value)}</td><td>${esc(t.flag)}</td><td>${esc(t.unit)}</td><td>${esc(t.range)}</td></tr>`).join("")}</table>`,
  quest: (r) => `<table><tr><th>Test Name</th><th>In Range</th><th>Out Of Range</th><th>Reference Range</th><th>Lab</th></tr>${r.tests.map((t) => `<tr><td>${esc(t.name)}</td><td>${t.flag ? "" : esc(`${t.value} ${t.unit}`)}</td><td>${t.flag ? esc(`${t.value} ${t.flag} ${t.unit}`) : ""}</td><td>${esc(t.range)}</td><td>EN</td></tr>`).join("")}</table>`,
  labcorp: (r) => `<table><tr><th>Test</th><th>Current Result and Flag</th><th>Previous Result and Date</th><th>Units</th><th>Reference Interval</th></tr>${r.tests.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.value)} ${esc(t.flag)}</td><td></td><td>${esc(t.unit)}</td><td>${esc(t.range)}</td></tr>`).join("")}</table>`,
  list: (r) => r.tests.map((t) => `<p>${esc(t.name)}: ${esc(t.value)} ${esc(t.unit)} (Ref: ${esc(t.range)}) ${esc(t.flag)}</p>`).join(""),
};
const css = "body{font-family:Arial,sans-serif;font-size:11pt;color:#111;margin:36px} h1{font-size:15pt;margin:0} h2{font-size:12pt;margin:18px 0 8px} .meta{font-size:9pt;color:#444} table{border-collapse:collapse;width:100%} th,td{border-bottom:1px solid #ccc;padding:5px 6px;text-align:left;font-size:10pt} th{background:#eee}";
const browser = await chromium.launch();
const page = await browser.newPage();
for (const r of reports) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${header(r.title)}${layouts[r.format](r)}<p class="meta">This is a synthetic report for software testing. Not real patient data.</p></body></html>`);
  await page.pdf({ path: path.join(out, `${r.id}.pdf`), format: "Letter" });
}
await browser.close();
console.log(`Built ${reports.length} PDFs in ${out}`);
