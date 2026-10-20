// Safety cases that must never regress: emergency symptoms (current vs denied vs past) and
// critical lab values with or without a lab flag, unit or printed range. Every urgency rule is
// pending clinician review (docs/clinical-rules-for-review.md); these tests pin the current
// behaviour so any change to it is deliberate. Usage: serve the site on :4173, then
//   node scripts/eval/safety-cases.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// [report text, expected: "emergency" (call 911 wording), "urgent" (contact your doctor today), "not urgent"]
const CASES = [
  ["No chest pain, no shortness of breath, no fainting.", "not urgent"],
  ["Patient reports severe chest pain right now.", "emergency"],
  ["Denies chest pain. Has shortness of breath since this morning.", "emergency"],
  ["History of stroke in 2015, fully recovered.", "not urgent"],
  ["Family history of stroke.", "not urgent"],
  ["No fever, but chest pain started an hour ago.", "emergency"],
  ["Chest pain 3 years ago, resolved.", "not urgent"],
  ["PMH: seizure as a child.", "not urgent"],
  ["No chest pain at the visit. Later today: chest pain while walking.", "emergency"],
  ["s/p stroke, on rehab.", "not urgent"],
  ["Negative for shortness of breath and chest pain.", "not urgent"],
  ["Mother had a stroke. Patient has slurred speech today.", "emergency"],
  ["Patient has fainting episodes this week.", "urgent"],
  ["Blood pressure 186/124 at home.", "urgent"],
  ["Potassium 6.8 mmol/L (3.5-5.1)", "urgent"],
  ["Potassium 6.8 (3.5-5.1)", "urgent"],
  ["Potassium 6.8", "urgent"],
  ["Potassium 7.1 HH mmol/L 3.5-5.1", "urgent"],
  ["Glucose 38 mg/dL 70-99", "urgent"],
  ["Glucose 2.1 mmol/L 3.9-5.5", "urgent"],
  ["Glucose 2.1 3.9-5.5", "urgent"],
  ["Sodium 118 mmol/L 135-145", "urgent"],
  ["Hemoglobin 6.1 g/dL 12.0-15.5", "urgent"],
  ["Haemoglobin 61 g/L 115-155", "urgent"],
  ["Calcium 3.4 mmol/L 2.2-2.6", "urgent"],
  ["Calcium 13.8 mg/dL 8.6-10.3", "urgent"],
  ["Platelets 12 x10^3/uL 150-400", "urgent"],
  ["INR 5.6 0.8-1.2", "urgent"],
  ["Troponin I 0.9 ng/mL <0.04", "urgent"],
  ["Potassium 5.4 mmol/L 3.5-5.3", "not urgent"],
  ["Glucose 110 mg/dL 70-99", "not urgent"],
  ["LDL cholesterol 190 mg/dL <100", "not urgent"],
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof buildReportView === "function");
let failures = 0;
for (const [text, expected] of CASES) {
  const got = await page.evaluate((t) => {
    const a = analyzeReportTextLocally(t);
    const v = buildReportView(a, "en");
    return { emergency: v.emergency, urgent: a.riskLevel === "urgent" || v.urgent, headline: v.headline, reasons: a.urgentReasons, steps: v.steps.map((s) => s.title) };
  }, text);
  const actual = got.emergency ? "emergency" : got.urgent ? "urgent" : "not urgent";
  // An emergency must also say to call emergency services and never offer an exercise step.
  const wordingOk = actual !== "emergency" || (/emergency care/i.test(got.headline) && !got.steps.some((s) => /walk/i.test(s)));
  const ok = actual === expected && wordingOk;
  if (!ok) failures += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${JSON.stringify(text)} -> ${actual} (expected ${expected}) ${JSON.stringify(got.reasons)}`);
}
await browser.close();
console.log(failures ? `${failures} safety case(s) FAILED` : `All ${CASES.length} safety cases passed`);
process.exitCode = failures ? 1 : 0;
