// Large randomized check of the report explainer. Generates synthetic lab reports for
// people of different ages, sexes and regions (US, UK/EU, India units and wording),
// with known answers taken from the range printed on each report, then checks:
//   1. every value is read and compared with the printed range correctly,
//   2. the headline "X of N outside range" matches the truth,
//   3. the food plan follows its own guideline thresholds and is safe for kidney results,
//   4. a critical value (for example potassium 6.5+) is treated as urgent with no exercise plan,
//   5. no medicine names or doses appear anywhere in the explanation.
// Usage: serve the site on :4173, then
//   node scripts/eval/stress.mjs --text 100000 [--pdf 500] [--photo 50] [--seed 1] [--workers 4] [--json out.json]
// Text mode feeds the text a PDF reader would produce; --pdf renders real PDFs and reads
// them with the site's PDF reader; --photo screenshots tilted, slightly blurred pages and
// reads them with the site's on-device OCR. All data is synthetic.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));

const dir = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : fallback; };
const TEXT_N = Number(arg("--text", 1000));
const PDF_N = Number(arg("--pdf", 0));
const PHOTO_N = Number(arg("--photo", 0));
const SEED = Number(arg("--seed", 1));
const WORKERS = Number(arg("--workers", 4));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";

// Seeded random numbers so a failing report can be rebuilt from its id.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Test templates, taken from the vetted eval cases (scripts/eval/cases.json), grouped by region style.
const { reports: CASES } = JSON.parse(fs.readFileSync(path.join(dir, "cases.json"), "utf8"));
const SI_UNITS = /mmol\/l|umol|g\/l$|10\^9|pmol|ng\/l|ug\/l|mu\/l|^s$|nmol/i;
const INDIA_UNITS = /cumm|gm\/dl|mg\/dl$|uiu\/ml$/;
const templates = { us: new Map(), si: new Map(), india: new Map() };
for (const r of CASES) for (const t of r.tests) {
  const style = INDIA_UNITS.test(t.unit) && !/^mg\/dL$/.test(t.unit) ? "india" : SI_UNITS.test(t.unit) ? "si" : "us";
  const list = templates[style].get(t.key) || [];
  if (!list.some((x) => x.name === t.name && x.unit === t.unit)) list.push({ key: t.key, name: t.name, unit: t.unit, range: t.range, decimalComma: /\d,\d(?!\d\d)/.test(t.range) });
  templates[style].set(t.key, list);
}
const REGIONS = [
  { name: "United States", style: "us", lab: "Sample Clinical Laboratory, Ohio" },
  { name: "United Kingdom", style: "si", lab: "NHS Pathology (sample)" },
  { name: "Germany", style: "si", lab: "Labor Beispiel GmbH", comma: true },
  { name: "Spain", style: "si", lab: "Laboratorio de Ejemplo", comma: true },
  { name: "India", style: "india", lab: "Sample Diagnostics, Hyderabad" },
  { name: "Canada", style: "si", lab: "Sample Medical Labs, Toronto" },
  { name: "Mexico", style: "us", lab: "Laboratorio Clínico de Muestra" },
  { name: "Nigeria", style: "si", lab: "Sample Diagnostics, Lagos" },
  { name: "Philippines", style: "us", lab: "Sample Medical Center, Manila" },
  { name: "Australia", style: "si", lab: "Sample Pathology, Sydney" },
];
const FIRST = ["Maria", "Raj", "Aisha", "Chen", "Olu", "Sofia", "Hiroshi", "Fatima", "James", "Priya", "Kwame", "Lucia", "Mohammed", "Ana", "Dmitri", "Mei", "Carlos", "Ngozi", "Emma", "Arjun", "Leila", "Tomás", "Yuki", "Grace"];
const LAST = ["Garcia", "Patel", "Okafor", "Nguyen", "Smith", "Kim", "Müller", "Hassan", "Silva", "Yamamoto", "Reddy", "Mensah", "Ivanova", "Lopez", "Wang", "Cohen", "Adeyemi", "Fernández", "Brown", "Singh"];
// Ranges that differ for women (the templates are mostly the male ranges).
const FEMALE_RANGE = { "hemoglobin|g/dL": "12.0-15.5", "hemoglobin|g/L": "115-155", "hemoglobin|gm/dL": "12.0-15.0", "hematocrit|%": "34.0-46.6", "creatinine|mg/dL": "0.50-1.00", "creatinine|umol/L": "45-84", "creatinine|mg/dl": "0.5-1.1" };

function parseRange(range) {
  const r = range.replace(/(\d),(\d)/g, "$1.$2");
  let m = r.match(/^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/);
  if (m) return { low: Number(m[1]), high: Number(m[2]) };
  m = r.match(/^\s*(<=?|>=?)\s*(\d+(?:\.\d+)?)\s*$/);
  if (m) return m[1][0] === "<" ? { low: null, high: Number(m[2]), strictHigh: m[1] === "<" } : { low: Number(m[2]), high: null, strictLow: m[1] === ">" };
  return null;
}
const decimalsOf = (range) => Math.max(0, ...(range.replace(/(\d),(\d)/g, "$1.$2").match(/\d+(?:\.(\d+))?/g) || []).map((n) => (n.split(".")[1] || "").length));

function makeValue(rand, range, decimals, wantFar) {
  const { low, high } = range;
  const span = low !== null && high !== null ? high - low : (high ?? low) * 0.5;
  const pick = rand();
  let value; let truth;
  if (pick < 0.55 || (low === null && pick < 0.75) || (high === null && pick < 0.75)) {
    const lo = low ?? (high ?? 0) * 0.4; const hi = high ?? (low ?? 0) * 2;
    value = lo + (hi - lo) * (0.1 + 0.8 * rand()); truth = "normal";
  } else if ((pick < 0.78 && high !== null) || low === null) {
    value = high + span * (wantFar ? 0.8 + rand() : 0.05 + 0.4 * rand()); truth = "high";
  } else {
    value = low - Math.min(low * 0.6, span * (wantFar ? 0.6 + rand() * 0.3 : 0.05 + 0.3 * rand())); truth = "low";
  }
  const step = 10 ** -decimals;
  value = Math.max(step, Math.round(value / step) * step);
  // Re-derive the truth after rounding; skip values sitting on a limit (labs differ there).
  if ((high !== null && Math.abs(value - high) < step / 2) || (low !== null && Math.abs(value - low) < step / 2)) return null;
  truth = high !== null && value > high ? "high" : low !== null && value < low ? "low" : "normal";
  return { value: value.toFixed(decimals), truth };
}

const LAYOUTS = ["table", "quest", "labcorp", "list", "twocol"];
const KEYS_POOL = [...new Set(CASES.flatMap((r) => r.tests.map((t) => t.key)))];

function makeReport(index) {
  const rand = rng(SEED * 1_000_003 + index);
  const region = REGIONS[Math.floor(rand() * REGIONS.length)];
  const sex = rand() < 0.5 ? "F" : "M";
  const age = 18 + Math.floor(rand() * 80);
  const person = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
  const count = 4 + Math.floor(rand() * 14);
  const keys = [...KEYS_POOL].sort(() => rand() - 0.5).slice(0, count).filter((k) => sex === "F" ? k !== "psa" : true);
  const tests = [];
  for (const key of keys) {
    const pool = templates[region.style].get(key) || templates.us.get(key) || templates.si.get(key);
    if (!pool) continue;
    const t = pool[Math.floor(rand() * pool.length)];
    let rangeText = sex === "F" ? FEMALE_RANGE[`${key}|${t.unit}`] || t.range : t.range;
    const range = parseRange(rangeText);
    if (!range) continue;
    const decimals = decimalsOf(rangeText);
    const made = makeValue(rand, range, decimals, rand() < 0.15);
    if (!made) continue;
    const comma = region.comma || t.decimalComma;
    const show = (s) => (comma ? s.replace(/(\d)\.(\d)/g, "$1,$2") : s);
    if (comma) rangeText = show(rangeText);
    const flagStyle = rand();
    const flag = made.truth === "normal" || flagStyle < 0.3 ? "" : flagStyle < 0.75 ? (made.truth === "high" ? "H" : "L") : made.truth === "high" ? "High" : "Low";
    tests.push({ key, name: t.name, unit: t.unit, range: rangeText, value: show(made.value), number: Number(made.value), flag, truth: made.truth });
  }
  const bp = rand() < 0.4 ? `${100 + Math.floor(rand() * 75)}/${60 + Math.floor(rand() * 40)}` : "";
  return { id: `s${SEED}-${index}`, region: region.name, lab: region.lab, sex, age, person, layout: LAYOUTS[Math.floor(rand() * LAYOUTS.length)], tests, bp };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function rowsOf(r) {
  const T = r.tests;
  switch (r.layout) {
    case "quest": return [["Test Name", "In Range", "Out Of Range", "Reference Range", "Lab"], ...T.map((t) => [t.name, t.flag ? "" : `${t.value} ${t.unit}`, t.flag ? `${t.value} ${t.flag} ${t.unit}` : "", t.range, "EN"])];
    case "labcorp": return [["Test", "Current Result and Flag", "Previous Result and Date", "Units", "Reference Interval"], ...T.map((t) => [t.name, `${t.value} ${t.flag}`.trim(), "", t.unit, t.range])];
    case "twocol": return [["Test", "Result", "Range", "Test", "Result", "Range"], ...Array.from({ length: Math.ceil(T.length / 2) }, (_, i) => T.slice(i * 2, i * 2 + 2).flatMap((t) => [t.name, `${t.value} ${t.unit} ${t.flag}`.trim(), t.range]))];
    case "list": return T.map((t) => [`${t.name}: ${t.value} ${t.unit} (Ref: ${t.range}) ${t.flag}`.trim()]);
    default: return [["Test", "Result", "Flag", "Units", "Reference Range"], ...T.map((t) => [t.name, t.value, t.flag, t.unit, t.range])];
  }
}
const headerLines = (r) => [r.lab, `Patient: ${r.person}  Age/Sex: ${r.age} Y / ${r.sex}  Collected: 10/01/2026 08:12`, ...(r.bp ? [`Blood Pressure: ${r.bp} mmHg`] : [])];
const reportText = (r) => [...headerLines(r), "", ...rowsOf(r).map((row) => row.filter(Boolean).join("  ")), "", "Synthetic report for software testing."].join("\n");
const css = "body{font-family:Arial,sans-serif;font-size:11pt;color:#111;margin:36px;background:#fff} h1{font-size:15pt;margin:0} .meta{font-size:9pt;color:#444} table{border-collapse:collapse;width:100%} th,td{border-bottom:1px solid #ccc;padding:5px 6px;text-align:left;font-size:10pt} th{background:#eee}";
function reportHtml(r, photo) {
  const rows = rowsOf(r);
  const body = r.layout === "list" ? rows.map((row) => `<p>${esc(row[0])}</p>`).join("") : `<table>${rows.map((row, i) => `<tr>${row.map((c) => (i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`)).join("")}</tr>`).join("")}</table>`;
  const tilt = photo ? `transform:rotate(${photo.tilt}deg);filter:blur(${photo.blur}px) brightness(${photo.light});` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div style="${tilt}"><h1>${esc(r.lab)}</h1>${headerLines(r).slice(1).map((l) => `<p class="meta">${esc(l)}</p>`).join("")}${body}<p class="meta">Synthetic report for software testing. Not real patient data.</p></div></body></html>`;
}

// ---- Scoring ----
const RULE_KEY = { ldl: "ldl", totalCholesterol: "totalchol", triglycerides: "trig", a1c: "a1c", vitaminD: "vitd" };
const STATUS = { above: "high", below: "low", within: "normal", target_above: "normal", target_below: "normal", critical: "outside", outside: "outside", unknown: "unknown" };
const toNumber = (v) => parseFloat(String(v).replace(/,(?=\d{3}(?!\d))/g, "").replace(",", "."));
const DRUGS = /\b(metformin|statins?|atorvastatin|rosuvastatin|simvastatin|insulin|lisinopril|amlodipine|losartan|levothyroxine|aspirin|ibuprofen|warfarin|ozempic|semaglutide|prednisone|antibiotics?)\b/i;
const DOSE = /\b\d[\d,.]*\s?(mg|mcg|µg|iu|units)\b\s*(a day|daily|per day|twice|once)/i;
// Thresholds the plan states it uses (public guidelines), in US units.
function usValue(t) {
  const u = t.unit.toLowerCase(); const v = toNumber(t.value);
  if (t.key === "ldl" || t.key === "totalchol") return u.includes("mmol") ? v * 38.67 : v;
  if (t.key === "trig") return u.includes("mmol") ? v * 88.57 : v;
  if (t.key === "a1c") return u.includes("mmol") ? v / 10.929 + 2.15 : v;
  if (t.key === "vitd") return u.includes("nmol") ? v / 2.496 : v;
  return v;
}
const near = (v, limit) => Math.abs(v - limit) / limit < 0.03;
const CRITICAL = (t) => {
  const v = toNumber(t.value); const u = t.unit.toLowerCase();
  if (t.key === "potassium") return v >= 6.5;
  if (t.key === "sodium") return v < 120;
  if (t.key === "glucose") return u.includes("mmol") ? v < 3.0 : v < 54;
  if (t.key === "hemoglobin") return u === "g/l" ? v < 70 : v < 7;
  return false;
};

function score(r, got, out) {
  const found = new Map();
  for (const row of got.rows) {
    const key = row.rule ? RULE_KEY[row.key] : row.key;
    if (!found.has(key)) found.set(key, { value: row.rule ? toNumber(row.valueText) : row.value, status: STATUS[row.status] || row.status });
  }
  let trueOutside = 0;
  for (const t of r.tests) {
    out.tests += 1;
    if (t.truth !== "normal") trueOutside += 1;
    const g = found.get(t.key);
    if (!g) { out.fail("not read", r, `${t.name} ${t.value} ${t.unit}`); continue; }
    out.read += 1;
    if (Math.abs(toNumber(g.value) - toNumber(t.value)) > 1e-9) { out.fail("wrong value", r, `${t.name}: report ${t.value}, read ${g.value}`); continue; }
    out.valueOk += 1;
    const ok = g.status === t.truth || (g.status === "outside" && t.truth !== "normal");
    if (!ok) { out.fail("wrong high/low", r, `${t.name} ${t.value} ${t.unit} range ${t.range}: truth ${t.truth}, said ${g.status}`); continue; }
    out.statusOk += 1;
  }
  out.reports += 1;
  if (got.count.outside !== trueOutside || got.count.total !== r.tests.length) out.fail("headline count", r, `truth ${trueOutside} of ${r.tests.length}, shown ${got.count.outside} of ${got.count.total}`);
  else out.countOk += 1;

  // Food plan follows its own thresholds.
  const has = (text) => got.food.some((f) => f.includes(text));
  const t = Object.fromEntries(r.tests.map((x) => [x.key, x]));
  const checks = [
    ["heart foods", (t.ldl && !near(usValue(t.ldl), 130)) || (t.totalchol && !near(usValue(t.totalchol), 200)) ? (t.ldl && usValue(t.ldl) >= 130) || (t.totalchol && usValue(t.totalchol) >= 200) : null, "soluble fiber"],
    ["triglyceride foods", t.trig && !near(usValue(t.trig), 150) ? usValue(t.trig) >= 150 : null, "sugary drinks, sweets"],
    ["blood sugar foods", t.a1c && !near(usValue(t.a1c), 5.7) ? usValue(t.a1c) >= 5.7 : null, "plate method"],
    ["vitamin D foods", t.vitd && !near(usValue(t.vitd), 30) ? usValue(t.vitd) < 30 : null, "vitamin D foods"],
  ];
  for (const [name, expected, marker] of checks) {
    if (expected === null || expected === undefined) continue;
    // A conflicting lab rule (heart vs. both missing) is only checked when the test is on the report.
    if (expected !== has(marker)) out.fail("diet rule", r, `${name}: expected ${expected ? "present" : "absent"}`);
    else out.dietOk += 1;
  }
  // Kidney safety: high potassium or reduced kidney function needs a caution before more potassium-rich food.
  const kidney = (t.potassium && t.potassium.truth === "high") || (t.egfr && t.egfr.truth === "low") || (t.creatinine && t.creatinine.truth === "high");
  const potassiumFoods = got.food.some((f) => /DASH|beans|lentils|fruit, vegetables|nuts/i.test(f));
  if (kidney && potassiumFoods && ![...got.food, ...got.safety].some((s) => /potassium/i.test(s))) out.fail("diet safety (kidney/potassium)", r, `potassium-rich foods suggested with ${["potassium", "egfr", "creatinine"].filter((k) => t[k] && t[k].truth !== "normal").map((k) => `${t[k].name} ${t[k].value}`).join(", ")} and no potassium caution`);
  else out.kidneyOk += 1;
  // Critical values: urgent, and no new exercise plan.
  const critical = r.tests.filter(CRITICAL);
  if (critical.length) {
    out.criticalReports += 1;
    if (got.riskLevel !== "urgent" || !got.urgentMove) out.fail("critical not urgent", r, `${critical.map((x) => `${x.name} ${x.value} ${x.unit}`).join(", ")}: risk ${got.riskLevel}`);
    else out.criticalOk += 1;
  }
  if (DRUGS.test(got.allText) || DOSE.test(got.allText.replace(/[^.]*(sodium|salt)[^.]*\./gi, ""))) out.fail("medicine name or dose", r, (got.allText.match(DRUGS) || got.allText.match(DOSE))[0]);
}

function newTally() {
  const t = { reports: 0, tests: 0, read: 0, valueOk: 0, statusOk: 0, countOk: 0, dietOk: 0, kidneyOk: 0, criticalReports: 0, criticalOk: 0, failures: {}, examples: {} };
  t.fail = (kind, r, detail) => {
    t.failures[kind] = (t.failures[kind] || 0) + 1;
    (t.examples[kind] ||= []).length < 8 && t.examples[kind].push(`${r.id} [${r.region}, ${r.sex}${r.age}, ${r.layout}] ${detail}`);
  };
  return t;
}

// Runs inside the site page: the same functions the website uses.
function analyzeInPage(text) {
  const a = analyzeReportTextLocally(text);
  const plan = buildPersonalPlan(a, "en");
  const section = (k) => plan.sections.find((s) => s.key === k)?.items.map((i) => i.text) || [];
  const rows = allTestRows(a) || a.panelResults || [];
  return {
    rows: rows.map((x) => ({ key: x.key, rule: Boolean(x.rule), value: x.value, valueText: x.valueText, status: x.status })),
    count: outsideRangeCount(a),
    riskLevel: a.riskLevel,
    food: section("food"),
    safety: section("safety"),
    urgentMove: plan.urgent,
    allText: [...(a.findings || []).map((f) => `${f.label} ${f.level} ${f.detail}`), ...(a.suggestions || []), ...(a.questions || []), ...plan.sections.flatMap((s) => s.items.map((i) => i.text))].join(" "),
  };
}

async function openPage(browser) {
  const page = await browser.newPage();
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof analyzeReportTextLocally === "function" && typeof buildPersonalPlan === "function");
  await page.evaluate(`window.__analyze = ${analyzeInPage.toString()}`);
  return page;
}

// --dump <n> <file>: write n generated report texts (for checking the phone app's copy).
if (process.argv.includes("--dump")) {
  const n = Number(arg("--dump")); const file = process.argv[process.argv.indexOf("--dump") + 2];
  fs.writeFileSync(file, JSON.stringify(Array.from({ length: n }, (_, i) => reportText(makeReport(i)))));
  process.exit(0);
}
// --show <index>: print one generated report and what the site made of it.
if (process.argv.includes("--show")) {
  const r = makeReport(Number(arg("--show")));
  const b = await chromium.launch(); const page = await openPage(b);
  console.log(reportText(r)); console.log(JSON.stringify(r.tests.map((t) => `${t.name} ${t.value} ${t.truth}`)));
  console.log(JSON.stringify(await page.evaluate((t) => window.__analyze(t), reportText(r)), null, 1));
  await b.close(); process.exit(0);
}

const browser = await chromium.launch();
const tallies = {};
const started = Date.now();

if (TEXT_N) {
  const tally = (tallies.text = newTally());
  const CHUNK = 500;
  let next = 0;
  const pages = await Promise.all(Array.from({ length: WORKERS }, () => openPage(browser)));
  await Promise.all(pages.map(async (page) => {
    while (next < TEXT_N) {
      const from = next; next = Math.min(TEXT_N, next + CHUNK);
      const batch = []; for (let i = from; i < next; i += 1) batch.push(makeReport(i));
      const results = await page.evaluate((texts) => texts.map((t) => window.__analyze(t)), batch.map(reportText));
      batch.forEach((r, i) => score(r, results[i], tally));
      if (tally.reports % 20000 < CHUNK) console.error(`text: ${tally.reports}/${TEXT_N} (${Math.round((Date.now() - started) / 1000)}s)`);
    }
  }));
}

if (PDF_N) {
  const tally = (tallies.pdf = newTally());
  const render = await browser.newPage();
  const page = await openPage(browser);
  for (let i = 0; i < PDF_N; i += 1) {
    const r = makeReport(10_000_000 + i);
    await render.setContent(reportHtml(r));
    const bytes = (await render.pdf({ format: "Letter" })).toString("base64");
    const got = await page.evaluate(async ({ bytes, id }) => {
      const raw = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
      const text = await extractPdfText(new File([raw], `${id}.pdf`, { type: "application/pdf" }));
      return window.__analyze(text);
    }, { bytes, id: r.id });
    score(r, got, tally);
    if ((i + 1) % 500 === 0) console.error(`pdf: ${i + 1}/${PDF_N}`);
  }
}

if (PHOTO_N) {
  const tally = (tallies.photo = newTally());
  const render = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  const page = await openPage(browser);
  for (let i = 0; i < PHOTO_N; i += 1) {
    const r = makeReport(20_000_000 + i);
    const rand = rng(SEED + i);
    await render.setContent(reportHtml(r, { tilt: ((rand() - 0.5) * 4).toFixed(2), blur: (rand() * 0.6).toFixed(2), light: (0.85 + rand() * 0.25).toFixed(2) }));
    const bytes = (await render.screenshot({ type: "jpeg", quality: 70 + Math.floor(rand() * 25), fullPage: true })).toString("base64");
    const got = await page.evaluate(async (bytes) => {
      const raw = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
      const image = await preparePhotoForOcr(new Blob([raw], { type: "image/jpeg" }));
      const text = checkOcrNumbers(await recognizeImages([image])).text;
      return window.__analyze(text);
    }, bytes);
    score(r, got, tally);
    if ((i + 1) % 25 === 0) console.error(`photo: ${i + 1}/${PHOTO_N}`);
  }
}
await browser.close();

const pct = (n, d) => (d ? Math.round((10000 * n) / d) / 100 : null);
const summary = Object.fromEntries(Object.entries(tallies).map(([mode, t]) => [mode, {
  reports: t.reports, tests: t.tests,
  readRate: pct(t.read, t.tests), valueAccuracy: pct(t.valueOk, t.tests), highLowAccuracy: pct(t.statusOk, t.tests),
  headlineCountCorrect: pct(t.countOk, t.reports), dietRulesCorrect: pct(t.dietOk, t.dietOk + (t.failures["diet rule"] || 0)),
  kidneyDietSafe: pct(t.kidneyOk, t.reports), criticalReports: t.criticalReports, criticalHandledUrgently: pct(t.criticalOk, t.criticalReports),
  medicineMentions: t.failures["medicine name or dose"] || 0, failures: t.failures, examples: t.examples,
}]));
summary.seconds = Math.round((Date.now() - started) / 1000);
console.log(JSON.stringify(summary, null, 2));
const jsonAt = process.argv.indexOf("--json");
if (jsonAt > -1) fs.writeFileSync(process.argv[jsonAt + 1], JSON.stringify(summary, null, 2));
