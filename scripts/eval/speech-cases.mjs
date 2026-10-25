// Read-aloud safety: the words a voice says for a lab result must mean exactly what is written.
// spokenText (script.js) turns "12 x10^3/uL", "<0.04" and "3.5-5.1" into words; these cases pin
// decimals, units, ranges, comparisons, negative numbers and negations in English and Spanish.
// Usage: serve the site on :4173, then node scripts/eval/speech-cases.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// [written text, language, exact spoken text]
const CASES = [
  ["Potassium: 6.8 mmol/L.", "en", "Potassium: 6 point 8 millimoles per liter."],
  ["2.5 mg/dL", "en", "2 point 5 milligrams per deciliter"],
  ["25 mg/dL", "en", "25 milligrams per deciliter"],
  ["0.04 ng/mL", "en", "0 point 0 4 nanograms per milliliter"],
  ["0.4 ng/mL", "en", "0 point 4 nanograms per milliliter"],
  ["Lab range: <0.04", "en", "Lab range: less than 0 point 0 4"],
  ["Lab range: >60", "en", "Lab range: more than 60"],
  ["Lab range: ≥ 40", "en", "Lab range: more than or equal to 40"],
  ["Lab range: <=5", "en", "Lab range: less than or equal to 5"],
  ["Lab range: 3.5-5.1", "en", "Lab range: 3 point 5 to 5 point 1"],
  ["Lab range: 70 – 99", "en", "Lab range: 70 to 99"],
  ["Base excess -2.0 mmol/L", "en", "Base excess minus 2 point 0 millimoles per liter"],
  ["Range (-2-2)", "en", "Range (minus 2 to 2)"],
  ["12 x10^3/uL", "en", "12 thousand per microliter"],
  ["4.1 x 10^6/uL", "en", "4 point 1 million per microliter"],
  ["250 x10^9/L", "en", "250 billion per liter"],
  ["5.2 uIU/mL", "en", "5 point 2 micro international units per milliliter"],
  ["2.1 mIU/L", "en", "2 point 1 milli international units per liter"],
  ["40 IU/L and 30 U/L", "en", "40 international units per liter and 30 units per liter"],
  ["55 mL/min/1.73m2", "en", "55 milliliters per minute per 1 point 7 3 square meters"],
  ["6.1 %", "en", "6 point 1 percent"],
  ["5.7% to 6.4%", "en", "5 point 7 percent to 6 point 4 percent"],
  ["44 mmol/mol", "en", "44 millimoles per mole"],
  // A unit it does not know stays exactly as written.
  ["7 widgets/hL", "en", "7 widgets/hL"],
  // Words are never changed: negations, "may", urgency.
  ["This result alone does not show prediabetes.", "en", "This result alone does not show prediabetes."],
  ["A high TSH may mean the thyroid is underactive.", "en", "A high TSH may mean the thyroid is underactive."],
  ["Contact your doctor today, or get emergency care if you feel very unwell.", "en", "Contact your doctor today, or get emergency care if you feel very unwell."],
  ["Potasio: 6.8 mmol/L.", "es", "Potasio: 6 punto 8 milimoles por litro."],
  ["Rango del laboratorio: <0.04", "es", "Rango del laboratorio: menos de 0 punto 0 4"],
  ["Rango del laboratorio: >60", "es", "Rango del laboratorio: más de 60"],
  ["Rango del laboratorio: 3.5-5.1", "es", "Rango del laboratorio: 3 punto 5 a 5 punto 1"],
  ["12 x10^3/uL", "es", "12 mil por microlitro"],
  // 10^9 is "mil millones" in Spanish; "billón" would be a thousand times too large.
  ["250 x10^9/L", "es", "250 mil millones por litro"],
  ["6.1 %", "es", "6 punto 1 por ciento"],
  ["110 mg/dL", "es", "110 miligramos por decilitro"],
  ["Su informe no dice si fue en ayunas.", "es", "Su informe no dice si fue en ayunas."],
];

// Every number written must come back, in order, from the spoken words.
const REPORTS = [
  "Potassium 6.8 mmol/L 3.5-5.1\nGlucose 110 mg/dL 70-99\nTroponin I 0.9 ng/mL <0.04",
  "Platelets 12 x10^3/uL 150-400\nHemoglobin A1c 6.1 % 4.0-5.6\nTSH 5.2 uIU/mL 0.4-4.0",
  "eGFR 55 mL/min/1.73m2 >60\nCalcium 13.8 mg/dL 8.6-10.3\nINR 5.6 0.8-1.2",
  "Sodium 140 mmol/L 135-145\nLDL cholesterol 151 mg/dL <100 H\nHDL cholesterol 46 mg/dL >40",
];

const browser = await chromium.launch();
const page = await browser.newPage();
// Only the website itself loads; usage counts and API calls never leave the test (it also runs
// against the live site).
const origin = new URL(base).origin;
await page.route("**/*", (route) => (route.request().url().startsWith(origin) ? route.continue() : route.abort()));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof spokenText === "function" && typeof buildReportView === "function");
let failures = 0;

for (const [text, lang, expected] of CASES) {
  const got = await page.evaluate(([t, l]) => spokenText(t, l), [text, lang]);
  if (got !== expected) {
    failures += 1;
    console.log(`FAIL [${lang}] ${JSON.stringify(text)}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(got)}`);
  }
}

const numbers = (text) => (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
const heard = (spoken, lang) => {
  const point = lang === "es" ? "punto" : "point";
  const joined = spoken.replace(new RegExp(`(\\d+) ${point} ((?:\\d )*\\d)(?!\\d)`, "g"), (m, whole, digits) => `${whole}.${digits.replace(/ /g, "")}`);
  return numbers(joined);
};
for (const report of REPORTS) {
  for (const lang of ["en", "es"]) {
    const lines = await page.evaluate(([t, l]) => {
      const view = buildReportView(analyzeReportTextLocally(t), l);
      return view.cards.flatMap((card) => [`${card.value}`, `${card.range || ""}`, card.meaning || "", card.label || ""])
        .concat(view.body)
        .map((line) => [line, spokenText(line, l)]);
    }, [report, lang]);
    for (const [written, spoken] of lines) {
      const want = numbers(written.replace(/x\s*10\^\d+/g, "").replace(/1\.73m2/g, "1.73"));
      const got = heard(spoken, lang);
      const negations = (s) => (s.match(/\b(not|no|nunca|sin)\b/gi) || []).length;
      if (JSON.stringify(want) !== JSON.stringify(got) || negations(written) !== negations(spoken)) {
        failures += 1;
        console.log(`FAIL [${lang}] numbers or negations changed\n  written ${JSON.stringify(written)}\n  spoken  ${JSON.stringify(spoken)}`);
      }
    }
  }
}

// End to end: press Listen on a rendered report and check what reaches the voice. Nothing is
// spoken before the button is pressed, and the range line is read with its result.
const listened = await page.evaluate(() => {
  const said = [];
  window.speechSynthesis.cancel = () => {};
  window.speechSynthesis.speak = (utterance) => said.push(utterance.text);
  renderLocalReportAnalysis(analyzeReportTextLocally("Troponin I 0.9 ng/mL <0.04\nPotassium 6.8 mmol/L 3.5-5.1"));
  const before = said.length;
  document.querySelector('[data-report-action="listen"]')?.click();
  return { before, said };
});
const all = listened.said.join(" | ");
if (process.env.SHOW_SPEECH) console.log(all);
for (const phrase of ["0 point 9 nanograms per milliliter", "less than 0 point 0 4", "6 point 8 millimoles per liter", "3 point 5 to 5 point 1"]) {
  if (!all.includes(phrase)) {
    failures += 1;
    console.log(`FAIL Listen did not say ${JSON.stringify(phrase)}\n  said ${JSON.stringify(all)}`);
  }
}
if (listened.before !== 0 || /mmol\/L|ng\/mL|<0/.test(all)) {
  failures += 1;
  console.log(`FAIL Listen spoke before the button was pressed, or read raw symbols: ${JSON.stringify(all)}`);
}

await browser.close();
console.log(failures ? `${failures} read-aloud case(s) failed` : `All ${CASES.length} read-aloud cases and ${REPORTS.length * 2} reports passed`);
process.exit(failures ? 1 : 0);
