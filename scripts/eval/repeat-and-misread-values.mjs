// Rules 2026-10-20.6. A test printed twice with different values must never lose the second,
// more concerning value ("Potassium 4.1" then "Potassium 6.9" was explained as "all within the
// lab's ranges"), and a number glued to letters ("S.9", "1O8") must never be read as a result
// (it was read as an A1C of 9 % and a glucose of 1 mg/dL). Found in the 2026-10-23 re-check.
// Usage: serve the site on :4173, then node scripts/eval/repeat-and-misread-values.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// [name, report text, check(result) -> true when correct]. result = { risk, labs, panel, repeats, es }
const CASES = [
  ["second potassium is dangerous", "Potassium 4.1 mmol/L 3.5-5.1\nPotassium 6.9 mmol/L 3.5-5.1",
    (r) => r.risk === "urgent" && r.panel.potassium === "6.9" && r.repeats.includes("Potassium")],
  ["previous and current LDL", "Previous result: LDL cholesterol 98 mg/dL\nCurrent result: LDL cholesterol 151 mg/dL <100 H",
    (r) => r.labs["LDL cholesterol"] === 151 && r.repeats.includes("LDL cholesterol")],
  ["two A1C results", "Hemoglobin A1c 5.4 % 4.0-5.6\nHemoglobin A1c 7.9 % 4.0-5.6",
    (r) => r.labs.A1C === 7.9 && r.repeats.includes("A1C")],
  ["same value twice is not a repeat", "Potassium 4.1 mmol/L 3.5-5.1\nPotassium 4.1 mmol/L 3.5-5.1",
    (r) => r.panel.potassium === "4.1" && r.repeats.length === 0],
  ["LDL goal is not a second result", "LDL cholesterol 151 mg/dL\nLDL goal <100 mg/dL",
    (r) => r.labs["LDL cholesterol"] === 151 && r.repeats.length === 0],
  ["LDL/HDL ratio is not a second LDL", "LDL cholesterol 151 mg/dL <100 H\nLDL/HDL ratio 3.2",
    (r) => r.labs["LDL cholesterol"] === 151 && r.repeats.length === 0],
  ["urine glucose is not a second blood glucose", "Glucose 95 mg/dL 70-99\nGlucose, urine Negative",
    (r) => r.panel.glucose === "95" && r.repeats.length === 0],
  ["A1C misread S.9 is not read", "Hemoglobin A1c S.9 % 4.0-5.6",
    (r) => r.labs.A1C === undefined],
  ["glucose misread 1O8 is not read", "Glucose 1O8 mg/dL 70-99",
    (r) => r.panel.glucose === undefined && r.risk !== "urgent"],
  ["dot leaders still read", "HbA1c.......5.9 % 4.0-5.6",
    (r) => r.labs.A1C === 5.9],
  ["Spanish wording for a repeat", "Potassium 4.1 mmol/L 3.5-5.1\nPotassium 6.9 mmol/L 3.5-5.1",
    (r) => r.es.some((d) => d.startsWith("Su informe muestra otro resultado de"))],
];

const browser = await chromium.launch();
const page = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof analyzeReportTextLocally === "function");
let failed = 0;
for (const [name, text, check] of CASES) {
  const r = await page.evaluate((t) => {
    const a = analyzeReportTextLocally(t);
    const es = typeof translateReportAnalysis === "function" ? translateReportAnalysis(a, "es").findings.map((f) => f.detail) : [];
    return {
      risk: a.riskLevel,
      labs: Object.fromEntries((a.labValues || []).map((v) => [v.label, v.value])),
      panel: Object.fromEntries((a.panelResults || []).map((p) => [p.key, p.valueText])),
      repeats: a.findings.filter((f) => f.level === "More than one result").map((f) => f.label),
      es,
    };
  }, text);
  const ok = check(r);
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${JSON.stringify({ risk: r.risk, labs: r.labs, panel: r.panel, repeats: r.repeats })}`);
}
await browser.close();
console.log(failed ? `${failed} check(s) FAILED` : "All repeat and misread checks passed");
process.exit(failed ? 1 : 0);
