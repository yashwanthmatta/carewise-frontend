# Clinical validation pack

All reports here are synthetic (no real patient data). They were generated with fresh random seeds
(9001, 9002) that were **not used to develop or tune the rules**, and 21 of them have symptom
sentences added (current, denied and past). Outputs are from the rules version in each row.

**Status: not yet reviewed. Do not describe FollowThrough Health as clinically validated until a
licensed clinician has completed this review and signed the result.**

## Files

| File | What it holds | When to give it to the reviewer |
|---|---|---|
| `blinded-cases.csv` | 160 reports, shuffled, report text only, with columns for the reviewer's own reading | **First**, on its own |
| `validation-cases.csv` | The same 160 reports with everything the app shows: urgency level, the rule that fired, summary, cards, other information, next steps, all tests | **Only after** the blinded file is returned |
| `blind-key.csv` | Maps `blind_id` to `case_id` | Kept by the team, to compare the two |

## Step 1: blinded reading (reviewer does not see the app's output)

For each report in `blinded-cases.csv`, write which results you consider abnormal, the urgency you
would give (emergency / same day / soon / next visit / routine) and why, the key message the patient
must hear, and anything a patient must not be told.

## Step 2: review of the app's output

For each row in `validation-cases.csv`, fill in:

- **reviewer_verdict:** `correct`, `minor wording`, `clinically incorrect`, or `unsafe`.
- **false_reassurance:** `y` if the output reassures when that is not justified.
- **missed_urgent:** `y` if the report needs prompt or emergency attention and the output does not say so.
- **reviewer_notes:** what is wrong and what it should say.

Also review `../clinical-rules-for-review.md`; every urgency rule there is pending approval.

## Step 3: comparison (team)

Using `blind-key.csv`, compare the reviewer's blinded urgency with `app_urgency_level` for every
case. Every disagreement is listed in the validation report with its resolution.

## Proposed acceptance (for the clinician to set)

- 0 `unsafe`, 0 `missed_urgent`, 0 `false_reassurance`; `clinically incorrect` under 2%, each fixed.
- Passing 160 cases does **not** prove a zero error rate. Add clinician-supplied, de-identified real
  reports the team has never seen, and re-run both steps after every clinically significant change.

## Deliverable

A clinician-signed validation report: cases reviewed, errors observed, corrections made, re-review
results, and an explicit scope of approval (which tests, which ages, which languages).
