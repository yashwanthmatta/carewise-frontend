# Clinical validation readiness

Written 22 Nov 2026. **No qualified clinician has reviewed or signed off any version of the interpretation rules, explanations or the AI Health Guide.** Nothing in this repository is clinician-approved, and AI-generated review is not clinical review.

## Where things stand

| Item | Fact |
|---|---|
| Live rules version | `2026-10-20.8` (`EXPLANATION_RULES_VERSION` in `script.js`; the app's `src/reportView.ts` is generated from it) |
| Version frozen for review | `2026-10-20.2` (`docs/releases/clinical-review-candidate-2026-10-20.2.md`) |
| Unreviewed changes since the freeze | `.3` to `.8`, recorded in `docs/releases/rules-2026-10-20.5.md`, `.6.md`, `.7.md` and `.8.md` |
| Existing reviewer pack | `docs/clinical-review-package.md`, `clinical-review-cover-note.md`, `clinical-rules-for-review.md`, `clinical-validation/` (160 blinded synthetic cases) |
| **Gap** | The pack describes `.5` as live; the site runs `.8`. Regenerate the case outputs for `.8` before sending (roadmap B4) |

## Automated evidence (synthetic data only)

| Suite | File | What it covers | Last result |
|---|---|---|---|
| Reading accuracy | `scripts/eval/run-eval.mjs` + `cases.json` | 68 reports, 200 tests: reading, value and flag | 100 / 100 / 100% (22 Nov) |
| Safety cases | `scripts/eval/safety-cases.mjs` | 34 urgent / not-urgent cases (for example potassium 6.8, glucose 38) | 34 / 34 |
| Heading values | `scripts/eval/heading-values.mjs` | Values printed under a heading (HbA1c in mmol/mol, LDL) | Pass |
| Edge formats | `scripts/eval/report-edge-formats.mjs`, `repeat-and-misread-values.mjs` | Duplicate names, repeated values, misreads | Pass |
| OCR decimals and ranges | `scripts/eval/ocr-range-decimals.mjs`, `ocr-resolution.mjs` | Decimal points and ranges from photos | Pass |
| Upload reading | `scripts/eval/upload-reading.mjs` | PDF and photo paths | Pass |
| Read-aloud | `scripts/eval/speech-cases.mjs` | 36 cases: decimals digit by digit, units, comparisons | Pass |
| Help assistant (backend) | `tests/api/test_assistant.py` (10), `test_assistant_reliability.py` (11), `tests/test_smoke_assistant.py` (4) | Failure handling, no dosing, pending medicine entries never used | Pass, with **mocked providers only** |
| Assistant evaluation | `scripts/assistant_eval/run.py` | Synthetic questions, live model | **Never run** (needs a working key and budget approval) |

**What this evidence does not show:**
- accuracy on real lab layouts;
- whether the explanations are clinically correct or safe;
- whether real people understand them.

## Known limitations and failure modes

| Failure mode | Current guard | Residual risk |
|---|---|---|
| A value is misread (decimal, unit, wrong line) | Source line shown; exact text kept, never rounded; OCR decimal evals | Untested on real scans; the source line only helps if people look |
| Wrong range or flag | The lab's printed range and flag are used, not ours | A missing range gives "No range to compare"; the user may still worry |
| A historical value is taken as current | Heading and repeat evals | Multi-date reports are lightly covered |
| A test isn't recognised | Listed in "All tests"; no explanation invented | The user may assume "not mentioned" means "fine" |
| An urgent value is missed | 34 safety cases; urgency rules | The rules aren't clinician-approved; thresholds unreviewed |
| The explanation is wrong or too reassuring | Wording rules, no diagnosis, "ask your doctor" | **Main open risk**: no clinical review |
| The assistant hallucinates a medicine fact | Reference uses only `source-verified` entries (none exist yet); dosing replies withheld | The live model is unevaluated; the assistant is currently down |
| The assistant appears to be a doctor | The prompt says "You are not a doctor and never say or imply that you are" (wording tested); the UI says "It won't" | Unevaluated against a live model |

## Escalation in the product today

- Urgent rules show a "contact your doctor or emergency services" message before anything else (`safety-cases.mjs`).
- The assistant's instructions tell it to put emergencies first ("call 911 or their local emergency number now") and forbid diagnosis, doses and claiming to be a doctor. `test_assistant.py` checks that this wording is in the prompt. **Whether the live model follows it has not been evaluated.**
- No path sends anything to a human. FollowThrough has **no on-call clinician**.

## Clinical incident procedure (to adopt before any public launch)

**Owner:** _founder to name a responsible person_ (TBD). **Clinical adviser:** _TBD_.

| Step | Extraction error | Wrong or unsafe explanation | User report |
|---|---|---|---|
| 1. Intake | GitHub issue labelled `clinical-safety`, with **no patient data**. Reproduce with a synthetic copy of the layout | Same | Support inbox → the owner within 1 business day. Ask for a synthetic re-creation only, never the real report |
| 2. Triage (owner, within 1 business day) | Severity: **S1** could delay urgent care; **S2** wrong value or flag; **S3** cosmetic | Same scale | Same |
| 3. Contain | S1: pause explanations (`report_explanations_paused` already exists) or the affected rule | Same | Same |
| 4. Fix | Regression case added to the evals first, then the fix, then a rules version bump and release note | Same, **plus clinical adviser sign-off on the new wording** | — |
| 5. Correct | If saved reports could be affected: an in-app correction notice on the next open (to build), and email if signed in | Same | Reply to the reporter |
| 6. Learn | An entry in `docs/clinical-incidents.md`: date, severity, cause, fix, version | Same | Same |

Disclaimers don't remove liability. This procedure, a named owner and clinical review are what reduce it.

## The package to send a clinician (roadmap B4)

1. Regenerate `clinical-validation/validation-cases.csv` outputs at rules `.8`.
2. Add the `.3`–`.8` release notes and the assistant's system prompt and safety rules.
3. Add this file's limitation table and incident procedure.
4. Ask the reviewer to record verdicts per case and per rule, with the version.
5. Record the reviewer's name, credentials, date and scope in `docs/clinical-review-signoff.md`. Only a real reviewer fills this in.
