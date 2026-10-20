# Release record: clinical-review-candidate-2026-10-20.2

> **Engineering validation completed. Clinical rules remain pending independent clinician approval.
> This release is a candidate for clinical evaluation and does not establish clinical safety or
> regulatory clearance.**

| | |
|---|---|
| Release recorded (UTC) | 2026-10-20T00:58:25Z |
| Explanation rules version | `2026-10-20.2` (`EXPLANATION_RULES_VERSION`, identical in website and app) |
| Validation dataset version | `clinical-validation` generated at rules `2026-10-20.2` from seeds 9001 and 9002 (not used for tuning) |
| Engineering release merged by | yashwanthmatta (repository owner): website 2026-10-20T00:54:44Z, phone app 2026-10-20T00:55:08Z |
| Engineering sign-off (name, date) | ______________________ |
| Clinical approval | **Not given.** Pending: `clinical-validation/validation-report-template.md` |

## Code

| Repository | Release commit | PR / tested commit | Tag |
|---|---|---|---|
| carewise-frontend (website) | merge `63f6dd50712ecc94eeb2bab06c1b41be997dd568`; this record is added on top and the tag points to the commit that contains it | PR #82, head `38f965b96063ac73e5178cd07b83ff2d195cbca9` (identical content to the merge) | `clinical-review-candidate-2026-10-20.2` |
| carewise-mobile-app (phone app) | `97562f9ed7dd15194b8548b159e42428755e6169` | PR #32, head `7b6a8011e0e04b2acc9837470183ac4237aa534d` (identical content) | `clinical-review-candidate-2026-10-20.2` |
| carewise-production-backend (API) | `b566a3fa96b3d29aa37dd91995f10fd53fa4f5a7` | PR #33 | `clinical-review-candidate-2026-10-20.2` |

## Deployments

| Service | Render deploy | Commit | Live since (UTC) |
|---|---|---|---|
| Website (followthroughhealth.com) | `dep-dbbbnljm8hqs738p4h60` | `63f6dd5` | 2026-10-20T00:56:07Z |
| API (carewise-api.onrender.com) | `dep-dbbamtu7bikc73agiodg` | `b566a3f` | 2026-10-19T23:46:04Z |
| Phone app | Not distributed. CI passed; **no physical-device verification yet** (`carewise-mobile-app/docs/release-safety-checklist.md`) | `97562f9` | — |

## Validation files (SHA-256, first 16 hex)

| File | Checksum |
|---|---|
| `clinical-validation/blinded-cases.csv` | `923d6628bd20abae` |
| `clinical-validation/validation-cases.csv` | `bcbc558fa4cc55f8` |
| `clinical-validation/blind-key.csv` | `5db6654b095c54c2` |

## Test results

| Check | Result | Link |
|---|---|---|
| Website CI on PR head `38f965b` (syntax, cache, smoke, eval, 34 safety cases, photo-correction test, 5,000 standard + 5,000 hard randomized reports) | Passed | https://github.com/yashwanthmatta/carewise-frontend/actions/runs/39349273791 |
| Website CI on merge `63f6dd5` | Passed | https://github.com/yashwanthmatta/carewise-frontend/actions/runs/39350432623 |
| Website live smoke after deploy | Passed (2026-10-20T00:57:34Z) | https://github.com/yashwanthmatta/carewise-frontend/actions/runs/39350700648 |
| Website end-to-end regression suite (30 browser scripts) on `38f965b` | 30/30 passed, 0 failures | local run, recorded here |
| Phone app CI on PR head `7b6a801` | Passed | https://github.com/yashwanthmatta/carewise-mobile-app/actions/runs/39349630809 |
| Phone app CI on merge `97562f9` | Passed | https://github.com/yashwanthmatta/carewise-mobile-app/actions/runs/39350472103 |
| Website/app parity on merged code | Identical on 8,032 reports (5,000 standard, 3,000 hard, 32 safety), English and Spanish | local run |
| Backend tests, lint, readiness on `b566a3f` | 105 passed, lint clean, readiness passed | https://github.com/yashwanthmatta/carewise-production-backend/actions/runs/39343469570 |
| Backend pause switch (`/features` report_explanations) on `b566a3f` | 2/2 tests passed | `tests/api/test_features.py` |
| Backend live smoke | Passed | https://github.com/yashwanthmatta/carewise-production-backend/actions/runs/39349199691 |

## Known limitations

See `../clinical-review-package.md`. In short: adult thresholds only and no patient context; urgency
from fixed rules pending review; a missing lab flag is only caught when a value crosses a threshold;
photo reading can misread plausible-looking numbers; symptom detection reads words, not the person;
Spanish is a draft; validation cases are synthetic; the phone app has not been verified on a device.

## Changing this candidate

This record and its tags are not edited. If the clinician requires a change, the rules get a new
version (for example `2026-10-21.1`), the validation pack is regenerated, and a new release record and
tag are created. This candidate stays as it is for traceability.
