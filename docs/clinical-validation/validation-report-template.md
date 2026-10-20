# FollowThrough Health clinical validation report (template)

To be completed and signed by the reviewing clinician. Until it is signed, FollowThrough Health
must not be described as clinically validated or safe for clinical use.

## 1. Reviewer

| | |
|---|---|
| Name | |
| Credentials and specialty | |
| License number and state | |
| Conflicts of interest | |
| Review dates | |

## 2. What was reviewed

| | |
|---|---|
| Explanation rules version (`EXPLANATION_RULES_VERSION`) | |
| Website commit / app build | |
| Rules sheet (`clinical-rules-for-review.md`) version | |
| Cases: blinded (`blinded-cases.csv`) | number reviewed: |
| Cases: app output (`validation-cases.csv`) | number reviewed: |
| Additional real de-identified cases supplied by the reviewer | number and source: |

## 3. Results

| Measure | Count | Case IDs |
|---|---|---|
| Unsafe outputs | | |
| Missed urgent or emergency findings | | |
| False reassurance | | |
| Clinically incorrect statements | | |
| Minor wording issues | | |
| Blinded urgency vs app urgency: disagreements | | |

## 4. Rule decisions

For each rule in `clinical-rules-for-review.md`: Agree / Change / Remove, with the change required.
Attach the marked-up sheet.

Including, specifically: the uncertainty message and escalation for a critical value read from a
photo that may be misread; the emergency (call 911) vs same-day symptom lists; the critical-value
thresholds; and the "well outside the range" wording.

## 5. Corrections and re-review

| Issue | Rule or wording changed | New rules version | Re-reviewed on | Result |
|---|---|---|---|---|
| | | | | |

Any unsafe or missed-urgent finding requires the underlying rule to be corrected and the affected
validation steps repeated before sign-off.

## 6. Decision and scope

- [ ] Approved for patient education use within the scope below
- [ ] Approved with conditions (list)
- [ ] Not approved

Scope of approval (tests, adult/child, languages, report types, photo vs PDF):

Conditions and limits:

Re-review required when: any change to an urgency rule, threshold, or explanation wording; a new
test type; a new language; or yearly, whichever comes first.

Signature: ______________________   Date: __________
