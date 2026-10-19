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

## 2. What makes a report "urgent" (contact the doctor today)

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
| Blood pressure | ≥ 180 systolic (> 180/120 shown as "Very high — get medical care now") | |
| Symptoms in the report text | Not negated mentions of: chest pain, trouble/shortness of breath, stroke signs, suicide, severe bleeding, fainting, confusion, anaphylaxis signs, coughing blood, severe abdominal pain, stiff neck, non-fading rash, blue lips, seizure (full list in `emergencyTerms`). | |

When urgent: the summary says "Contact your doctor today. If you feel very unwell, seek emergency care", and no new exercise plan is given.

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
