// Each report's "Questions to ask your doctor" and suggestions are about its own results.
// Found 2026-11-09: lists were padded with the same general questions (a thyroid report showed
// one thyroid question and four general ones), and for signed-in people the server's next steps,
// which are the same for every report, came before the report's own suggestions.
// Usage: serve the site on :4173, then node scripts/eval/report-questions.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

const REPORTS = {
  anemia: ["Sample Lab\nHemoglobin 9.1 L g/dL 12.0-15.5\nFerritin 6 L ng/mL 15-150\nMCV 72 L fL 80-100", /anemia|iron/i],
  diabetes: ["Sample Lab\nGlucose 182 H mg/dL 70-99\nHbA1c 8.4 H % 4.0-5.6\nTriglycerides 260 H mg/dL <150", /A1C|triglycerides|glucose/i],
  kidney: ["Sample Lab\nCreatinine 2.4 H mg/dL 0.6-1.3\neGFR 28 L mL/min/1.73m2 >=60\nPotassium 5.6 H mmol/L 3.5-5.1", /kidney|eGFR/i],
  thyroid: ["Sample Lab\nTSH 8.9 H mIU/L 0.4-4.0\nFree T4 0.6 L ng/dL 0.8-1.8", /TSH/],
  liver: ["Sample Lab\nALT 142 H U/L 7-56\nAST 120 H U/L 10-40\nBilirubin, Total 2.1 H mg/dL 0.1-1.2", /liver/i],
};
const NORMAL = "Sample Lab\nHemoglobin 14.2 g/dL 13.5-17.5\nGlucose 88 mg/dL 70-99\nCreatinine 0.9 mg/dL 0.6-1.3";

const browser = await chromium.launch();
const page = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
await page.route(/fonts\.|jsdelivr|onrender/, (route) => route.abort());
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof reportQuestions === "function");
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };
const questionsFor = (text, language = "en") => page.evaluate(([t, l]) => { const a = analyzeReportTextLocally(t); return { list: reportQuestions(a, buildReportView(a, l), l), general: GENERAL_REPORT_QUESTIONS.map((q) => translateReportText(q, l)) }; }, [text, language]);

const lists = {};
for (const [name, [text, about]] of Object.entries(REPORTS)) {
  const { list, general } = await questionsFor(text);
  lists[name] = list;
  const generalCount = list.filter((q) => general.includes(q)).length;
  check(about.test(list[0]) && generalCount <= 2 && generalCount <= list.length - generalCount, `${name}: first question "${list[0]}", ${generalCount} general of ${list.length}`);
}
const names = Object.keys(lists);
for (let i = 0; i < names.length; i += 1) for (let j = i + 1; j < names.length; j += 1) {
  const shared = lists[names[i]].filter((q) => lists[names[j]].includes(q)).length;
  check(shared <= 2, `${names[i]} and ${names[j]} share ${shared} question(s)`);
}
const normal = await questionsFor(NORMAL);
check(normal.list.length >= 2, `a normal report still gets ${normal.list.length} general questions`);
const spanish = await questionsFor(REPORTS.liver[0], "es");
check(spanish.list.filter((q) => spanish.general.includes(q)).length <= 2, "Spanish: general questions limited too");

// Signed in: the report's own suggestions come before the server's next steps, except in an emergency.
const steps = ["Prepare questions for a licensed clinician.", "Do not change medication without clinician approval."];
const routine = await page.evaluate(([t, s]) => buildBackendReportDisplayAnalysis({ id: "a", risk_level: "routine", recommendations: { next_steps: s } }, t).suggestions, [REPORTS.kidney[0], steps]);
check(!steps.includes(routine[0]), `signed-in routine report: first suggestion is the report's own ("${routine[0]}")`);
const emergency = await page.evaluate(([t]) => buildBackendReportDisplayAnalysis({ id: "a", risk_level: "emergency", recommendations: { next_steps: ["Use emergency care now."] } }, t).suggestions, [REPORTS.kidney[0]]);
check(emergency[0] === "Use emergency care now.", `signed-in emergency: "${emergency[0]}" comes first`);

await browser.close();
if (failed) { console.log(`${failed} report question check(s) failed`); process.exit(1); }
console.log("All report question checks passed");
