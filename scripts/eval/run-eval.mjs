// Runs every sample PDF through the website's own PDF reader and explainer, then scores
// the result against cases.json. Usage: serve the site on :4173, then
//   node scripts/eval/run-eval.mjs [--json results.json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Uses the project copy of Playwright when installed (CI), else the machine-wide one.
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));

const dir = path.dirname(fileURLToPath(import.meta.url));
const { reports } = JSON.parse(fs.readFileSync(path.join(dir, "cases.json"), "utf8"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
const LAB_VALUE_KEYS = { "LDL cholesterol": "ldl", "Total cholesterol": "totalchol", Triglycerides: "trig", A1C: "a1c", "Vitamin D": "vitd" };

function statusOfLabValue(key, flag) {
  if (/in range|better range|normal|within/i.test(flag)) return "normal";
  return key === "vitd" ? "low" : "high";
}
const statusOfPanel = (s) => ({ above: "high", below: "low", within: "normal" }[s] || s || "unknown");
const sameNumber = (a, b) => Math.abs(parseFloat(String(a).replace(",", ".")) - parseFloat(String(b).replace(",", "."))) < 1e-9;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

const rows = [];
for (const r of reports) {
  const bytes = fs.readFileSync(path.join(dir, "pdfs", `${r.id}.pdf`)).toString("base64");
  const result = await page.evaluate(async ({ bytes, id }) => {
    const raw = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
    const file = new File([raw], `${id}.pdf`, { type: "application/pdf" });
    const text = await extractPdfText(file);
    const a = analyzeReportTextLocally(text);
    return {
      text,
      labValues: (a.labValues || []).map((v) => ({ label: v.label, value: String(v.value), flag: v.flag })),
      panel: (a.panelResults || []).map((p) => ({ key: p.key, value: String(p.value), status: p.status })),
    };
  }, { bytes, id: r.id });
  const found = new Map();
  result.labValues.forEach((v) => { const key = LAB_VALUE_KEYS[v.label]; if (key) found.set(key, { value: v.value, status: statusOfLabValue(key, v.flag) }); });
  result.panel.forEach((p) => { if (!found.has(p.key)) found.set(p.key, { value: p.value, status: statusOfPanel(p.status) }); });
  for (const t of r.tests) {
    const got = found.get(t.key);
    rows.push({
      report: r.id, format: r.format, test: t.name, key: t.key, expectValue: t.value, expectStatus: t.expect,
      gotValue: got?.value ?? null, gotStatus: got?.status ?? null,
      read: Boolean(got), valueOk: Boolean(got && sameNumber(got.value, t.value)), statusOk: Boolean(got && got.status === t.expect),
    });
  }
}
await browser.close();

const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : 0);
const total = rows.length;
const summary = {
  reports: reports.length,
  tests: total,
  readRate: pct(rows.filter((r) => r.read).length, total),
  valueAccuracy: pct(rows.filter((r) => r.valueOk).length, total),
  flagAccuracy: pct(rows.filter((r) => r.statusOk).length, total),
};
const problems = rows.filter((r) => !r.valueOk || !r.statusOk);
console.log(JSON.stringify(summary));
problems.forEach((p) => console.log(`  ✗ ${p.report} · ${p.test}: expected ${p.expectValue} (${p.expectStatus}), got ${p.gotValue ?? "not read"} (${p.gotStatus ?? "-"})`));
const jsonAt = process.argv.indexOf("--json");
if (jsonAt > -1) fs.writeFileSync(process.argv[jsonAt + 1], JSON.stringify({ summary, rows }, null, 2));
process.exitCode = problems.length ? 1 : 0;
