# Cover note for the reviewing clinician

Send this with the review folder. It says what to review, in what order, and what to sign.

---

Dear Dr. [Name],

Thank you for reviewing FollowThrough Health. It explains lab reports in plain language for patients
and their families, and gives clinicians a way to approve those explanations before patients see them.
Everything you'll review is **synthetic**. No real patient data is involved.

**What we're asking:** is the app's output correct, safe and not misleading? In particular: does it
ever give **false reassurance**, or **miss something urgent**? The app doesn't diagnose, prescribe or
name medicines, and it isn't marketed as clinically validated. Your review decides whether it can be.

## Two versions

- **Version 2026-10-20.2** is the frozen review version (a protected release). The full 160-case pack
  is built from it.
- **Version 2026-10-20.5** is what runs live today. It adds four changes made after the freeze:
  1. Results far outside the lab's range are labelled "Far above / Far below the lab's range". This is
     display only and **not** treated as urgent.
  2. The summary no longer mentions folate when only vitamin B12 was tested.
  3. Extraction fix: a test name in a heading can't take another test's value.
  4. Extraction fix: "Vitamin D, 25-hydroxy" with no result isn't read as a value of 25.

  Across your 160 cases these change **no urgency levels**, but they change the wording or labels of
  **97 cases**. They need your review too; they aren't validated just because urgency didn't change.

## Order of work (fine to do over several sittings)

1. **Blinded reading (first, on its own):** `clinical-validation/blinded-cases.csv`. For each
   report, write which results you consider abnormal, the urgency you'd give and why, and the key
   message the patient must hear. Please return this before opening anything else.
2. **Rules:** `clinical-rules-for-review.md`, urgent decisions first. Approve, change or reject each
   rule. All urgency rules are marked pending your approval.
3. **App output for version .2:** `clinical-validation/validation-cases.csv`. Give each case a verdict:
   correct / minor wording / clinically incorrect / unsafe, and mark false reassurance and missed urgent.
4. **The .5 changes:** `releases/rules-2026-10-20.5.md` lists the 97 changed cases. Compare them with
   `clinical-validation-2026-10-20.5/validation-cases.csv`. The main question is whether "Far above /
   Far below the lab's range" is appropriate without being alarming, given it doesn't change urgency.
   The extraction fixes are shown with examples in `../scripts/eval/heading-values.mjs`.
5. **Sign-off:** `clinical-validation/validation-report-template.md`. Please note **which version each
   verdict applies to** (.2 or .5).

## What happens with your findings

Any rule you mark incorrect or unsafe is changed only through a new, versioned release that you can
check again. We won't describe the app as clinically reviewed until the signed report covers the
version that's live.

Questions at any time: [your name, email, phone].

Thank you,
[Your name]
FollowThrough Health
