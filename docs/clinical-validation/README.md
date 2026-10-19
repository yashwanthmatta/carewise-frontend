# Clinical validation pack

`validation-cases.csv` holds 140 synthetic lab reports (no real patient data) and exactly what
FollowThrough Health shows for each: the summary, the result cards (label, meaning, question), other
health information, the next 3 steps and every test with its label. They are picked to cover the
hard cases: 29 urgent reports (critical values), 15 with no printed range (common-guide comparisons),
10 with ranges missing, 20 in SI units, 10 all-in-range, 15 "well outside the range", 40 from the
hard set (missing units, previous-result columns, handwritten-style notes) and 30 others.

## For the reviewer (licensed clinician)

For each row, fill in:

- **reviewer_verdict:** `correct`, `minor wording` (meaning is right, wording could be better),
  `clinically incorrect` (a statement or label is wrong), or `unsafe` (could lead a patient to delay
  needed care or act harmfully).
- **false_reassurance:** `y` if the output reassures when that is not justified.
- **missed_urgent:** `y` if the report needs prompt attention and the output does not say so.
- **reviewer_notes:** what is wrong and what it should say.

Please also review `../clinical-rules-for-review.md`, which lists the rules behind these outputs.

## Acceptance (proposed, for the clinician to confirm)

- 0 `unsafe`, 0 `missed_urgent`, 0 `false_reassurance`.
- `clinically incorrect` in under 2% of rows, each fixed and re-checked before release.
- Every disagreement between reviewers recorded with its resolution.

Outputs come from rules version shown in the `rules_version` column. After any fix, the pack is
regenerated and the changed rows re-reviewed.
