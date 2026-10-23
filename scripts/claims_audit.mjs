// Marketing-claims check: fails if a public page or user-facing script uses wording the
// legal and advertising review marked as prohibited or outdated
// (docs/legal-advertising-review.md). It checks wording only; it does not judge whether a
// claim is true. A phrase is allowed when a negation comes just before it in the same
// sentence ("does not claim to be HIPAA compliant", "not 100% accurate").
// Run: node scripts/claims_audit.mjs
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PUBLIC_PAGES = [
  "index.html", "about.html", "faq.html", "safety.html", "demo.html", "support.html",
  "accessibility.html", "glossary.html", "packet.html", "share.html",
];
const SCRIPTS = ["docbridge.js", "help.js", "reminders.js", "packet-view.js", "share-view.js", "doctor-share.js"];

// [id, pattern, why, scope] — scope "all" also covers legal pages; "marketing" skips them
// (legal-page wording changes wait for counsel).
const RULES = [
  ["hipaa-compliant", /HIPAA[- ](compliant|certified|secure)/i, "Never claim HIPAA compliance or certification", "all"],
  ["clinically-validated", /clinically[- ](validated|proven|tested|approved)/i, "Clinical validation is not done", "all"],
  ["fda", /FDA[- ](approved|cleared|registered|certified)/i, "No FDA clearance or approval exists", "all"],
  // "Clinician approved" is allowed: DocBridge only shows an explanation a named clinician approved.
  ["doctor-endorsed", /((doctor|physician)[- ](approved|recommended|endorsed|trusted)|clinician[- ](recommended|endorsed|trusted))/i, "No clinician endorsement exists for the consumer app", "all"],
  ["diagnoses-disease", /\b(diagnoses|detects?|screens? for) (diseases?|cancer|conditions?|illness)/i, "Diagnosis or disease-detection claim", "all"],
  ["guaranteed-accuracy", /(100% accura|guarantee[ds]? (accura|result)|always accurate|never (wrong|misses))/i, "Guaranteed-accuracy claim", "all"],
  ["absolute-privacy", /(zero retention|completely private|100% private|bank[- ]level|military[- ]grade|unhackable)/i, "Absolute privacy or security claim", "all"],
  ["outcome-claim", /(improves? (health )?outcomes|saves? (doctors|clinicians|you) (hours|time)|reduces? (clinician |doctor )?workload)/i, "Unproven outcome or time-saving claim", "all"],
  ["ehr-integration", /(EHR integration|integrates? with (Epic|Cerner|athena))/i, "No EHR integration exists", "all"],
  ["any-report", /Explain any (lab|report|scan)/i, "Absolute coverage claim; the reader supports a set list of tests", "marketing"],
  ["lifetime-record", /Lifetime health record/i, "Implies data kept forever", "marketing"],
  ["ai-draft", /\bAI draft\b/i, "DocBridge drafts are rule-based, not AI", "marketing"],
  ["deidentified-pilot", /de-identified or (a )?samples?/i, "Clinic evaluation is synthetic-only (pilot-clinic-onboarding.md)", "marketing"],
];

const NEGATION = /\b(not|never|no|nothing|isn't|doesn't|don't|does not|do not|without|cannot|yet to)\b[^.!?]{0,80}$/i;

function visibleText(source, isHtml) {
  if (!isHtml) return source;
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

async function files() {
  const legal = (await readdir(path.join(ROOT, "legal"))).filter((f) => f.endsWith(".html")).map((f) => `legal/${f}`);
  return [...PUBLIC_PAGES, ...SCRIPTS, ...legal];
}

const failures = [];
for (const file of await files()) {
  let source;
  try { source = await readFile(path.join(ROOT, file), "utf8"); } catch { continue; }
  const isLegal = file.startsWith("legal/");
  const lines = source.split("\n");
  lines.forEach((rawLine, index) => {
    const line = visibleText(rawLine, file.endsWith(".html"));
    for (const [id, pattern, why, scope] of RULES) {
      if (scope === "marketing" && isLegal) continue;
      const match = pattern.exec(line);
      if (!match) continue;
      if (NEGATION.test(line.slice(0, match.index))) continue;
      failures.push(`${file}:${index + 1} [${id}] "${match[0]}" — ${why}`);
    }
  });
}

if (failures.length) {
  console.error(`Claims check failed (${failures.length}):\n${failures.join("\n")}`);
  console.error("See docs/legal-advertising-review.md for approved wording.");
  process.exit(1);
}
console.log(JSON.stringify({ claims_check: "ok", rules: RULES.length }, null, 2));
