// Clinic visit summary: "What changed since the last lab" keeps each lab's unit and never counts a
// change between two units as "changed" (28 Nov 2026). Found: 162 mg/dL then 4.2 mmol/L LDL was listed
// as "162 → 4.2 mmol/L" and counted in the agenda's "N changed since last time". Nothing is converted.
// A signed-in clinic is simulated with synthetic data; no request leaves the browser.
// Usage: serve the site on :4173, then node scripts/eval/clinic-visit-units.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const clinic = { id: "clinic_synthetic", name: "Synthetic Clinic", clinician_name: "Dr. Example", role: "owner" };
const marker = (name, value, unit, status) => ({ name, value, unit, range: "", status });
const packet = (id, date, markers) => ({ id, status: "approved", patient_ref: "REF-1", lab_date: date, markers, summary: "Synthetic.", questions: [], created_at: `${date}T00:00:00Z` });

async function visitText(changes) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => localStorage.setItem("carewiseAuthToken", "synthetic-token"));
  await context.route(/fonts\.|jsdelivr/, (route) => route.abort());
  await context.route(/onrender\.com/, (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const latest = packet("p2", "2026-10-01", [marker("LDL cholesterol", "4.2", "mmol/L", "High"), marker("Potassium", "4.4", "mmol/L", "Normal")]);
    const earlier = packet("p1", "2026-06-01", [marker("LDL cholesterol", "162", "mg/dL", "High"), marker("Potassium", "4.2", "mmol/L", "Normal")]);
    if (path === "/clinics/me") return json(clinic);
    if (path.endsWith("/packets")) return json([latest, earlier]);
    if (path.endsWith("/metrics")) return json({ drafts: 0, manual_review: 0, needs_call: 0, approved_this_week: 2, median_review_seconds: null, patients_opened: 0, approved_without_edits: 2 });
    if (path.endsWith("/members")) return json([{ id: "m1", name: clinic.clinician_name, role: "owner", you: true }]);
    if (path.endsWith("/visit-settings")) return json({ prices: [], hidden_blocks: [], coverage_checklist: [] });
    if (path.includes("/patients/") && path.endsWith("/summary")) return json({ patient_ref: "REF-1", packets: [earlier, latest], changes, settings: { prices: [], hidden_blocks: [], coverage_checklist: [] } });
    return json({ detail: "Not found" }, 404);
  });
  const page = await context.newPage();
  await page.goto(`${base}#docbridge-title`, { waitUntil: "load" });
  const button = page.locator("[data-db-visit]").first();
  await button.waitFor({ state: "attached", timeout: 15000 });
  await button.evaluate((el) => el.click());
  await page.locator("#db-visit").waitFor({ state: "visible", timeout: 10000 });
  const text = (await page.locator("#db-visit").innerText()).replace(/\s+/g, " ");
  await browser.close();
  return text;
}

const ldl = { name: "LDL cholesterol", before: "162", before_unit: "mg/dL", now: "4.2", unit: "mmol/L", status: "High" };
const potassium = { name: "Potassium", before: "4.2", before_unit: "mmol/L", now: "4.4", unit: "mmol/L", status: "Normal" };

let text = await visitText([{ ...ldl, units_differ: true }, { ...potassium, units_differ: false }]);
check(/LDL cholesterol: 162 mg\/dL → 4\.2 mmol\/L · different units, so the numbers are not compared/.test(text), `the LDL row keeps both units and says it is not compared (${text.slice(0, 220)})`);
check(/Potassium: 4\.2 → 4\.4 mmol\/L \(Normal\)/.test(text), "a test in the same unit is still shown as a change");
check(/1 changed since last time/.test(text) && !/2 changed since last time/.test(text), "the agenda counts only the comparable change");

// An older server sends no units_differ flag: the units are still compared here.
text = await visitText([ldl, potassium]);
check(/162 mg\/dL → 4\.2 mmol\/L · different units/.test(text) && /1 changed since last time/.test(text), "without the server flag, different units are still caught");

// Units that differ only in case or spacing are the same unit.
text = await visitText([{ ...potassium, before_unit: "MMOL/L" }]);
check(/Potassium: 4\.2 → 4\.4 mmol\/L \(Normal\)/.test(text) && !/different units/.test(text), "MMOL/L and mmol/L are treated as one unit");

if (failed) { console.log(`${failed} clinic visit check(s) failed`); process.exit(1); }
console.log("All clinic visit unit checks passed");
