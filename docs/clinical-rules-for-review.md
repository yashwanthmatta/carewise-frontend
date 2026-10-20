# FollowThrough Health: interpretation rules for clinical review

Every rule the report explainer uses to decide what to say, gathered in one place for a
licensed clinician to review. Source: `script.js` (website) and `src/` in the mobile app,
which produce identical output. Nothing here has been clinically validated yet.

For each row: **Agree / Change / Remove**, with a note. Reviewer name, credentials and date at the end.

## 1. What decides High / Low

| Rule | Current behaviour | Review |
|---|---|---|
| Lab's printed range | A result is High or Low only against the range printed on that report. | |
| No range printed | Compared with a common adult guide (table 4) and labelled "High/Low compared with a common guide". Not counted as "outside the lab's ranges". | |
| Lab flag only (no range) | "Flagged by the lab". | |
| In range but past a common goal | LDL, total cholesterol, triglycerides, A1C, vitamin D: "In range, above/below a common goal". Not counted as outside. | |
| Vitamin D below range | "Low — below this lab's range". States that guidelines differ and that one result does not confirm a deficiency. | |
| A1C | 5.7–6.4%: "High — prediabetes range". 6.5% or higher: "High — diabetes range", with "a doctor confirms with repeat testing". | |
| Glucose | Fasting status read from the report ("fasting", FBS, FPG; "random", RBS, post-prandial). If unknown, the card says the result alone does not show prediabetes. | |

## 2. Urgency rules: ALL PENDING CLINICIAN APPROVAL

None of these rules is clinically approved yet. They decide the strongest messages the app shows.

### 2a. Emergency symptoms in the report text → "call 911 or your local emergency number"

Each mention is judged within its own sentence:
- **Denied** (ignored): "no", "not", "without", "denies", "negative for", "none of", "free of", "absence of", "ruled out", "never had" before the term ("No fever, but chest pain…" — only words after "but" count).
- **Past or family history** (ignored): "history of", "h/o", "hx of", "PMH", "previous", "prior", "remote", "family history", "mother/father had", "status post", "s/p", "in 2015" before; "in 2015", "3 years ago", "resolved", "in the past", "recovered" after.
- **Current** (counts): anything else.

Current mentions of these terms show "Your report mentions symptoms that may need emergency care. If you have … now, call 911 or your local emergency number": chest pain, trouble/difficulty breathing, shortness of breath, stroke, face droop, slurred speech, arm weakness, weakness on one side, sudden numbness, paralysis, suicide, overdose, poison, severe bleeding, loss of consciousness, unconscious, cannot wake, seizure, anaphylaxis, severe allergic reaction, swelling of the face or tongue, blue lips, coughing (up) blood, blood in vomit, sudden severe headache, carbon monoxide, severe burn, electric shock, near drowning, head/neck/spinal injury, heat stroke, fever and confusion, rash that does not fade, confusion, severe testicular pain, snake bite.

**Review:** Is each term right for "call 911"? Which should be same-day instead? Are the denial and history patterns enough?

### 2b. Same-day symptoms → "Contact your doctor today. If you feel very unwell, seek emergency care."

Current mentions of: fainting, severe abdominal pain, right lower abdomen (pain), severe dehydration, black stool, bloody diarrhea, vaginal bleeding, shoulder pain, high fever, hypothermia, hives, wheezing, difficulty swallowing, severe headache, eye injury, chemical exposure, animal bite, no urine, severe weakness, stiff neck. **Review each.**

### 2c. Lab values → "Contact your doctor today"

Applied **whether or not the lab flagged the result, with or without a printed range, and with the unit read or inferred** (mg/dL vs mmol/L from the unit, or from the size of the number when the unit is missing). The card says "High/Low — a level labs often treat as urgent".

| Trigger | Threshold | Review |
|---|---|---|
| Lab marks a result critical | HH, LL, Critical, Panic | |
| Glucose | < 54 or > 400 mg/dL (< 3.0 or > 22.2 mmol/L) | |
| Potassium | < 2.8 or > 6.2 mmol/L | |
| Sodium | < 120 or > 160 mmol/L | |
| Calcium | < 6.5 or > 13 mg/dL (< 1.63 or > 3.25 mmol/L) | |
| Hemoglobin | < 7 g/dL (< 70 g/L) | |
| Platelets | < 20 ×10³/µL | |
| INR | ≥ 5 | |
| Troponin | any value above the lab's range | |
| Blood pressure | ≥ 180 systolic or ≥ 120 diastolic | |

A dangerous value read from a photo that may be misread keeps the report urgent and says: "If the number is right, it is at a level labs often treat as urgent: confirm it now, and if it matches, contact your doctor today."

**Known limits for the reviewer:** thresholds are adult values, not age-, pregnancy- or condition-specific; a missing or wrongly read flag cannot be detected unless the value itself crosses a threshold; patient context (e.g. dialysis, anticoagulation targets) is unknown.

When urgent: no new exercise plan is suggested.

## 3. Results far outside the printed range (not urgent)

| Rule | Current behaviour | Review |
|---|---|---|
| Far outside the printed range | Above 1.5× the upper limit or below 0.67× the lower limit, or more than half the range's width beyond it. **Pending clinician review, this no longer claims urgency:** the summary says "Some results are well outside the lab's range. Share this report with your doctor and ask how soon they want to talk about it." Should any test use its own threshold or wording instead? | |
| Any result outside the range | "Bring these results up at your next visit." | |

## 4. Common guides used only when no range is printed

Glucose 70–99 fasting / 70–140 any time (3.9–5.5 / 3.9–7.8 mmol/L); HDL ≥ 40 mg/dL (≥ 1.0 mmol/L);
hemoglobin 12–17.5 g/dL (120–175 g/L); creatinine 0.6–1.3 mg/dL (53–115 µmol/L); eGFR ≥ 60;
potassium 3.5–5.1; sodium 135–145; calcium 8.5–10.2 mg/dL (2.1–2.6 mmol/L); platelets 150–450 ×10³/µL;
white cells 4–11 ×10³/µL; TSH 0.4–4.0. Not sex- or age-specific. **Review: acceptable as a fallback?**

## 5. Blood pressure found in the report text

Shown separately as "not a lab test result", labelled with the American Heart Association category:
normal < 120/80; elevated 120–129 and < 80; stage 1 130–139 or 80–89; stage 2 ≥ 140 or ≥ 90; very high > 180 or > 120.
States that one reading is not a diagnosis.

## 6. Food and activity suggestions (education only)

| Trigger | Suggestion source | Review |
|---|---|---|
| LDL ≥ 130 or total cholesterol ≥ 200 mg/dL | AHA: fats, fiber, fish | |
| Triglycerides ≥ 150 mg/dL | AHA: sugar, alcohol | |
| A1C ≥ 5.7% | ADA: plate, drinks; weight loss line only below 6.5% (CDC DPP) | |
| BP ≥ 130/80 | NHLBI DASH and AHA salt | |
| Vitamin D < 30 ng/mL | NIH: vitamin D foods; "ask before starting a supplement or choosing a dose" | |
| High potassium, high creatinine or low eGFR | Leads with "ask your doctor or a kidney dietitian before eating more potassium-rich foods"; no DASH suggestion | |
| Urgent report | No new exercise; "get medical care first" | |

The app never names a medicine or a dose, and never picks a date for repeat tests (the person enters the date their doctor gave).

## 7. Photos

Numbers read from a photo that fit the range only after moving a decimal point are shown as "Check this number"
until the person confirms them. These numbers are not counted. Every photo result says to check each number against the report.

---

Reviewer: ______________________  Credentials: ______________  Date: __________
