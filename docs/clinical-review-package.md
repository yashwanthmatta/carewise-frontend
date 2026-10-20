# Clinical review package

Hand this folder to the reviewing clinician. Engineering is frozen for review: interpretation rules
and wording change only to fix defects found in this review.

| Item | Where |
|---|---|
| Frozen rules version | `2026-10-20.2` (`EXPLANATION_RULES_VERSION` in `script.js`; the app's `src/reportView.ts` is generated from it) |
| Software builds reviewed | Website: commit recorded on the signed report (live at followthroughhealth.com). Phone app: build number from TestFlight / Play internal testing |
| Rules to approve, with urgent decisions first | `clinical-rules-for-review.md` |
| Blinded cases (give first, on their own) | `clinical-validation/blinded-cases.csv` (160 synthetic reports, report text only) |
| App outputs for the same cases (give after the blinded answers) | `clinical-validation/validation-cases.csv` (urgency level, rule that fired, summary, cards, steps, all tests) |
| How to review, acceptance criteria | `clinical-validation/README.md` |
| Sign-off record | `clinical-validation/validation-report-template.md` |
| Intended use, data flow, open legal items | `compliance-readiness.md` |

## Known limitations and unresolved risks (for the reviewer)

- Thresholds are adult values; no age, pregnancy, kidney-disease or medication context is known.
- Urgency comes from fixed rules; distance from the printed range does not set urgency.
- A lab flag that is missing or misread cannot be detected unless the value crosses a threshold.
- Photo reading can misread numbers, units and ranges. Doubtful numbers must be confirmed before
  anything is copied, shared or saved, but a misread that looks plausible may not be caught.
- Emergency-symptom detection reads words in the report text; it cannot assess the person.
- Spanish wording is a draft pending native medical review.
- Validation cases are synthetic; real de-identified reports supplied by the reviewer are needed.
- The phone app does not explain reports until it has checked the remote pause switch at least once.

## Revalidation

Any change to an urgency rule, threshold or explanation wording, a new test type or language, or
yearly: bump `EXPLANATION_RULES_VERSION`, regenerate the validation pack, and re-review the changed cases.
CI runs the safety cases, the photo-correction test and the randomized check on every pull request.
