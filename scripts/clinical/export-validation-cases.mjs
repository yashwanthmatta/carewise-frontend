// Regenerate the clinician validation pack from the rules the site runs now.
//
// The pack in docs/clinical-validation/ was frozen at rules 2026-10-20.2 and a copy made at .5, but
// the script that produced them was never committed. This one is: it runs the same 160 synthetic
// reports (seeds 9001/9002, never used to tune the rules) through analyzeReportTextLocally and
// buildReportView in a real browser and writes the columns the reviewer sees, with the reviewer
// columns left empty. It also writes a change list against an earlier pack, so a reviewer who
// already read .2 or .5 can see exactly which outputs changed.
//
// It never edits rules or wording. Synthetic data only.
// Usage: serve the site on :4173, then
//   node scripts/clinical/export-validation-cases.mjs <cases.csv> <out-dir> [<earlier-pack.csv>]
import fs from "node:fs";
import path from "node:path";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
const [casesPath, outDir, earlierPath] = process.argv.slice(2);
if (!casesPath || !outDir) { console.error("Usage: export-validation-cases.mjs <cases.csv> <out-dir> [<earlier-pack.csv>]"); process.exit(2); }

export function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true; else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; } else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return { head, rows: body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))) };
}
const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

// The labels the reviewed packs use, recovered from the .5 pack: all 160 cases map one to one.
const LEVEL = { emergency: "emergency (call 911)", urgent: "contact doctor today", needs_review: "well outside range: ask doctor how soon", attention: "discuss at next visit", routine: "routine" };

const { head, rows } = parseCsv(fs.readFileSync(casesPath, "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof buildReportView === "function" && typeof EXPLANATION_RULES_VERSION === "string");
const rulesVersion = await page.evaluate(() => EXPLANATION_RULES_VERSION);
const out = [];
for (const row of rows) {
  const got = await page.evaluate((text) => {
    const a = analyzeReportTextLocally(text);
    const v = buildReportView(a, "en");
    const symptoms = (a.emergencySymptoms || []).map((s) => (typeof s === "string" ? s : s.name || s.label || s.symptom || ""));
    const reasons = [...new Set([...symptoms, ...(a.urgentReasons || [])].filter(Boolean))];
    // value already carries its unit, exactly as printed on the report.
    const unit = () => "";
    return {
      level: v.emergency ? "emergency" : a.riskLevel,
      reason: reasons.length ? reasons.join("; ") : "none",
      summary: [v.headline ? `${v.headline.replace(/[.!?]$/, "")}.` : "", ...(v.body || [])].filter(Boolean).join(" "),
      cards: v.cards.map((c) => `${c.name}: ${c.value}${unit(c)} | ${c.label} | range ${c.range || "not printed"} | ${c.meaning || c.what || ""} | Ask: ${c.ask || ""}`).join("\n"),
      other: (v.other || []).map((o) => `${o.name}: ${o.value}${unit(o)} | ${o.label}`).join("\n"),
      steps: (v.steps || []).slice(0, 3).map((s) => `${s.title}: ${s.body}`).join("\n"),
      tests: v.tests.map((t) => `${t.name} ${t.value}${unit(t)} [${t.range || "no range"}] ${t.label}`).join("\n"),
    };
  }, row.report_text);
  out.push({ case_id: row.case_id, set: row.set, report_text: row.report_text, app_urgency_level: LEVEL[got.level] || got.level, app_urgency_reason: got.reason, summary: got.summary, result_cards: got.cards, other_info: got.other, next_3_steps: got.steps, all_tests: got.tests, rules_version: rulesVersion });
}
await browser.close();

const reviewerColumns = head.filter((h) => /^reviewer_|^false_reassurance|^missed_urgent/.test(h));
const columns = ["case_id", "set", "report_text", "app_urgency_level", "app_urgency_reason", "summary", "result_cards", "other_info", "next_3_steps", "all_tests", "rules_version", ...(reviewerColumns.length ? reviewerColumns : ["reviewer_verdict (correct / minor wording / clinically incorrect / unsafe)", "false_reassurance (y/n)", "missed_urgent (y/n)", "reviewer_notes"])];
fs.mkdirSync(outDir, { recursive: true });
const csv = [columns.map(quote).join(","), ...out.map((r) => columns.map((c) => quote(r[c] ?? "")).join(","))].join("\n") + "\n";
fs.writeFileSync(path.join(outDir, "validation-cases.csv"), csv);

if (earlierPath) {
  const earlier = Object.fromEntries(parseCsv(fs.readFileSync(earlierPath, "utf8")).rows.map((r) => [r.case_id, r]));
  const fields = ["app_urgency_level", "app_urgency_reason", "summary", "result_cards", "other_info", "next_3_steps", "all_tests"];
  const changes = [];
  for (const r of out) {
    const before = earlier[r.case_id];
    if (!before) { changes.push({ id: r.case_id, field: "(new case)", before: "", after: "" }); continue; }
    for (const f of fields) if ((before[f] || "").trim() !== (r[f] || "").trim()) changes.push({ id: r.case_id, field: f, before: before[f], after: r[f] });
  }
  const earlierVersion = Object.values(earlier)[0]?.rules_version || "earlier";
  const levelChanges = changes.filter((c) => c.field === "app_urgency_level");
  const lines = [
    `# Changes from rules ${earlierVersion} to ${rulesVersion}`, "",
    `Generated by \`scripts/clinical/export-validation-cases.mjs\` from the same ${out.length} synthetic cases. Reviewer columns are empty.`, "",
    `- Cases with any change: ${new Set(changes.map((c) => c.id)).size} of ${out.length}`,
    `- Urgency level changes: ${levelChanges.length}`, "",
    "| Case | Field | Before | After |", "|---|---|---|---|",
    ...changes.map((c) => `| ${c.id} | ${c.field} | ${String(c.before).replace(/\n/g, " / ").replace(/\|/g, "\\|")} | ${String(c.after).replace(/\n/g, " / ").replace(/\|/g, "\\|")} |`),
  ];
  fs.writeFileSync(path.join(outDir, "changes-since-earlier-pack.md"), lines.join("\n") + "\n");
  console.log(`changes vs ${earlierVersion}: ${new Set(changes.map((c) => c.id)).size} cases, ${changes.length} fields, ${levelChanges.length} urgency-level changes`);
}
console.log(`wrote ${out.length} cases at rules ${rulesVersion} to ${outDir}`);
