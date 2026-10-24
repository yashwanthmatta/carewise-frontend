# FollowThrough Health: advertising library (drafts for review)

**Not legal advice. No asset here is approved.** Every asset is a draft for counsel review, and
where marked, clinician review. No platform approval is guaranteed: Meta, Google, TikTok, LinkedIn
and Apple review each ad themselves and change their policies. Nothing here has been published or
paid for. Prepared 2026-10-23 by the legal and advertising review agent. See
`docs/legal-advertising-review.md` for the risk register and sources.

**Default calls to action**
- Consumers: **"Try a free sample report"** → `https://followthroughhealth.com/demo.html`. Made-up report, no sign-up.
- Clinicians: **"Try the synthetic DocBridge demo"** → `https://followthroughhealth.com/#doctor-demo`. Made-up clinic and labs, no sign-in.

**Do not advertise paid plans yet.** Plus and Family currently unlock nothing (register LA-01).

---

## 1. Claims we may use (pending counsel), and the proof on file

| Code | Claim (use these words or narrower) | Proof to keep on file | Clinician sign-off? |
|---|---|---|---|
| C1 | "Explains lab reports in plain words." | Screen recording of the sample report; product | No |
| C2 | "Shows each result next to the range your lab printed." | `scripts/eval/run-eval.mjs` results (68 reports; an internal test, not a clinical study) | No |
| C3 | "Your report is read on your phone or computer. Nothing is uploaded unless you save or share it." | `script.js` on-device OCR; register LA-13 | No |
| C4 | "Questions to ask the doctor, and a one-page brief to bring." | Product | No |
| C5 | "Try a free sample report. No sign-up." | `demo.html` | No |
| C6 | "We never sell your data or use it for ads." | Register LA-14 (no trackers); vendor terms (LA-16) | No |
| C7 | "English and Spanish." | Product. **Spanish wording is still a draft**, so don't run Spanish ads yet (LA-20) | Yes, for Spanish |
| C8 | DocBridge: "Nothing reaches a patient without a clinician's approval." | `legal/security.html` "Doctor in the loop"; code | No |
| C9 | DocBridge: "A draft appears right after you add a lab. You edit and approve it." | Timing measurement (LA-12) | No |
| C10 | DocBridge: "Try it with a made-up clinic and sample labs. No sign-in." | `#doctor-demo` | No |

### Never use (any channel, any language)

- "HIPAA compliant / certified / secure", "clinically validated / proven", "FDA approved / cleared", "doctor-approved / recommended / trusted" (consumer app), "AI doctor"
- "Diagnose", "detect", "catch it early", "know if you have…", "replaces your doctor", "find out what's wrong"
- "Accurate", "100%", "never misses", "always right", "instant answers"
- "Saves doctors hours", "cuts workload", "better outcomes", "fewer calls", "patients love it": no study exists
- "Integrates with Epic/Cerner/your EHR", "used by clinics", "trusted by [institution]", any clinic or hospital name or logo
- "Urgent", "Don't wait", "Your results could be dangerous", or any fear-based hook
- "Free" for paid plans; prices without "renews monthly until you cancel"
- Real patient reports, real names or real test results; screenshots without a "Sample" label

## 2. Privacy rules for all marketing

1. **No tracking pixels or SDKs** (Meta Pixel, Conversions API, Google Ads tag, TikTok Pixel, LinkedIn Insight Tag, session recorders) on the site or app. The privacy claim C6 and the HBNR depend on it. Enabling one needs counsel and the founder.
2. **Measure without tracking:** UTM parameters on links, counted only by the existing anonymous daily counters (for example "demo started" by `source`); platform-side reach and click reports; coupon or referral codes with no health data. Report results as totals only.
3. **No health-condition audiences:** no retargeting, lookalikes or Customer Match built from site visitors, users, waitlists or uploads. Use contextual, keyword or broad demographic targeting (adults 18+, caregivers as an interest, clinicians by job title on LinkedIn).
4. **Never upload user or waitlist emails** to an ad platform.
5. **Never send report contents, lab values or diagnosis-related events** to any ad or analytics system.
6. **Synthetic only:** every report, lab, name and clinic in ads is made up and labelled "Sample".
7. **Testimonials** only from real users, with written permission, no health details, and disclosure of any payment or free access. No AI-generated or composite "users". No fabricated clinicians.
8. **Referral campaigns** must never message a person's contacts automatically. The user shares their own link.
9. **Email campaigns** need an unsubscribe link and a postal address (CAN-SPAM). Never mail anyone who only gave a number for reminder calls.

## 3. Evaluation of proposed creative concepts

| Concept | Verdict | Risks | Safer version |
|---|---|---|---|
| Daughter helping her mother understand a lab report | REVIEW, usable | Personal-attribute targeting; implying the viewer's parent is ill; a real report on screen | Actors, a clearly labelled sample report, neutral results (some in range, one outside). Copy talks about the product ("helps families read lab reports"), never "your mom's kidneys". |
| Explaining unfamiliar lab terms | Good, low risk | A definition becoming advice | Use glossary-style definitions (`glossary.html`) and end with "Ask your doctor what it means for you." |
| Before-and-after report demonstration | REVIEW, reframe needed | "After" can imply better health or a diagnosis; platforms scrutinize before/after content | Show **the same sample report** as "lab page" → "plain words". Label it "Sample report. Same numbers, easier to read." Never before/after health results. |
| DocBridge clinician workflow | REVIEW, usable | Implying production use, EHR integration, time savings or clinic endorsements | Real screen recording of the synthetic demo with "Synthetic demo. Not for real patient data yet." No clinic names, no time-saved figures. |
| Spanish educational ads | HOLD | Spanish wording not yet reviewed (LA-20) | Prepare scripts only; run after translator and clinician review. |
| Short-form social videos | Good with rules | Fast cuts hiding disclaimers | Disclaimer on screen for 3+ seconds and in the caption; no urgency hooks. |
| Paid influencer collaborations | REVIEW, high care | Missing "Paid partnership" disclosure; outcome claims; real family reports | Written contract with the claim list (§1) and banned list. Platform branded-content tool turned on, plus "#ad" spoken and written. Sample report only. Counsel reviews each script before posting. |
| Referral campaigns | REVIEW | Rewards create a material connection; auto-messaging contacts; incentivized reviews | User-initiated share link only. Rewards disclosed. Never reward reviews or ratings (16 CFR 465). Counsel approves reward terms. |

## 4. Policy and disclosure codes used below

**Policy considerations**
- **PA**: Meta Personal Attributes: never assert or imply the viewer's or a relative's health condition ("your", "you have").
- **18+**: target adults only.
- **NT**: no health-based retargeting, lookalikes or Customer Match (Google "Health in personalized advertising"; Meta; TikTok).
- **HC**: platform healthcare policies: Google Healthcare and medicines; TikTok Healthcare and Pharmaceuticals (North America); LinkedIn may restrict any health ad.
- **END**: FTC Endorsement Guides and Consumer Reviews Rule: disclose material connections; no fake reviews.
- **FDA**: avoid diagnosis and triage claims (register LA-04).
- **ASA**: Apple Search Ads: only after App Store approval; must match the store listing.

**Required disclosures**
- **D1**: "Education only. Not medical advice or a diagnosis."
- **D2**: "Sample report. Made-up people and numbers."
- **D3**: "Paid partnership" / "#ad"
- **D4**: "Synthetic demo. Not for real patient data yet."
- **D5**: "Talk to your doctor about your results."

**Approval status for every asset: DRAFT, pending counsel.** Assets marked ✚ also need clinician
review because they paraphrase what a result means.

---

## 5. Instagram (10 concepts)

| # | Hook | Main copy | Visual direction | CTA | Audience | Policy | Proof | Disclosures | Status |
|---|---|---|---|---|---|---|---|---|---|
| IG1 | "What does 'eGFR' even mean?" | "Lab reports are written for clinicians. FollowThrough Health explains each line in plain words, next to the range your lab printed." | Carousel: a sample report line, then the plain-words card | Try a free sample report | Adults 18+, caregiving interest | PA, 18+, NT | C1, C2 | D1, D2 | Draft ✚ |
| IG2 | "The report came in at 9 pm." | "Read it in plain words tonight. Bring the right questions to the appointment." | Kitchen table, phone showing a labelled sample report, warm light | Try a free sample report | Adults 18+ | PA, 18+, NT, no fear framing | C1, C4 | D1, D2, D5 | Draft |
| IG3 | "Helping Mom with her lab results?" (asked about the viewer's role, not a condition; confirm with Meta review) | "FollowThrough Health helps families read lab reports together and get ready for the doctor." | Actor daughter and mother on a sofa, sample report on a tablet | Try a free sample report | Adults 35–65 | PA (borderline; test the variant "For families who help a parent with lab results") | C1, C4 | D1, D2 | Draft, PA check |
| IG4 | "Three questions to bring to the doctor" | "FollowThrough Health writes questions from the numbers on the report, so you don't forget at the visit." | Notebook-style card with 3 sample questions | Try a free sample report | Adults 18+ | 18+, NT | C4 | D1, D2, D5 | Draft |
| IG5 | "Your report stays on your phone." | "We read it on your device. Nothing is uploaded unless you save or share it. We never sell your data." | Phone with a lock-free, plain on-device animation (no "secure" badge) | Try a free sample report | Adults 18+ | NT; privacy claim must match code | C3, C6 | D1 | Draft |
| IG6 | "One page your doctor can read" | "Turn a lab report into a one-page brief to bring to the visit." | Sample doctor brief, printed on paper | Try a free sample report | Adults 18+ | 18+ | C4 | D1, D2 | Draft |
| IG7 | "Lab words, decoded: hemoglobin" | "Hemoglobin carries oxygen in your blood. Want every line of a report explained like this? Try a sample." | Single glossary card, brand colors | Try a free sample report | Adults 18+ | 18+, glossary wording only | C1 | D1, D5 | Draft ✚ |
| IG8 | "Same numbers. Easier to read." | "On the left, a sample lab page. On the right, the same results in plain words." | Split screen of the same synthetic report (not before/after health) | Try a free sample report | Adults 18+ | Before/after scrutiny: same report, labelled | C1, C2 | D1, D2 | Draft |
| IG9 | "Made for families who help a parent." | "Keep each person's reports separate, and bring a doctor brief to each visit. Free to start." | Three labelled profile chips: Me, Mum, Dad | Try a free sample report | Adults 35–65 | PA; "free to start" only (no paid plans) | C1, C4 | D1, D2 | Draft |
| IG10 (creator) | "I used to Google every line of Dad's labs." (creator's own words, true to their experience) | Creator walks through the **sample** report in the app; says it is for education and to ask the doctor. | Creator selfie video with on-screen "Paid partnership" | Try a free sample report | Creator's audience 18+ | END, PA, 18+ | C1, C4; creator contract | D1, D2, D3 | Draft, counsel per script |

## 6. Facebook (10 concepts)

| # | Hook | Main copy | Visual direction | CTA | Audience | Policy | Proof | Disclosures | Status |
|---|---|---|---|---|---|---|---|---|---|
| FB1 | "Lab report full of abbreviations?" | "FollowThrough Health explains each result in plain words and shows it next to the range your lab printed." | Static: sample report with plain-word labels | Try a free sample report | Adults 18+ | PA, 18+, NT | C1, C2 | D1, D2 | Draft |
| FB2 | "Getting ready for Dad's appointment?" (role, not condition) | "Bring questions written from the numbers on the report, and a one-page brief." | Photo: adult child with notepad and phone | Try a free sample report | Adults 35–65 | PA (test the neutral variant) | C4 | D1, D2, D5 | Draft, PA check |
| FB3 | "Try it with a made-up report first." | "See how it works in about 3 minutes. No sign-up, nothing saved." | Screen recording of `demo.html` | Try a free sample report | Adults 18+ | 18+ | C5 | D2 | Draft |
| FB4 | "Private by default." | "Your report is read on your own phone or computer. Nothing is uploaded unless you choose to save or share it." | Simple diagram: phone → stays on phone | Try a free sample report | Adults 18+ | NT | C3 | D1 | Draft |
| FB5 | "Glossary of 40+ lab terms" | "Free plain-word definitions for common blood tests. Explain your own report when you're ready." | Glossary page screenshot | See the glossary / Try a sample | Adults 18+ | 18+ | `glossary.html` | D1, D5 | Draft ✚ |
| FB6 | "What changed since the last report?" | "Compare reports on your device to see what moved, then ask your doctor what it means." | Two sample reports side by side | Try a free sample report | Adults 18+ | FDA (no "better/worse health" claim) | Product "What changed" | D1, D2, D5 | Draft ✚ |
| FB7 | "We never sell your data or use it for ads." | "No ad trackers on our site or app. Your health information isn't sold or used to train AI." | Text-only card | Read how we handle data | Adults 18+ | Claim must stay true (LA-14, LA-16) | C6 | — | Draft, vendor terms needed |
| FB8 | "Questions people ask about lab reports" | "Which reports can it read? Is it a diagnosis? (No.) Is my report uploaded? Answers in our FAQ." | FAQ carousel | Read the FAQ | Adults 18+ | 18+ | `faq.html` | D1 | Draft |
| FB9 (referral) | "Know someone sorting a parent's paperwork?" | "Share FollowThrough Health with your own link. [Reward terms, if approved.]" | Share sheet mock (the user taps share; no auto-messages) | Share your link | Existing users (organic only, not ad targeting) | END (disclose rewards), no auto-messaging | Referral terms | D3, if rewarded | Draft, counsel |
| FB10 (creator) | "How we read Mom's lab report together" (creator's true story, sample report on screen) | Creator explains they were paid, shows the sample flow, and says to ask the doctor. | Creator video, branded-content tag | Try a free sample report | Creator audience 18+ | END, PA | Contract | D1, D2, D3 | Draft, counsel per script |

## 7. TikTok video scripts (5)

All: 18+, no condition targeting, "Paid partnership" toggle for creators, disclaimer on screen for at least 3 seconds and in the caption.

**TT1, "Lab words in 15 seconds" (✚)**
- Hook (0–2s), on-screen text: "3 lab words, explained."
- Script: "A1C: your average blood sugar over about three months. eGFR: how well the kidneys filter. TSH: a thyroid signal. Want your own report in plain words? Try a free sample first."
- Visual: three glossary cards, then a sample report scroll.
- CTA: Try a free sample report.
- Disclosures: D1, D5. Proof: C1, glossary. Status: Draft ✚.

**TT2, "The 9 pm report"**
- Hook: "The lab report arrived. The doctor's office is closed."
- Script: "Open it in FollowThrough Health. It reads the report on your phone and explains each line in plain words. Then it writes questions for the appointment."
- Visual: night kitchen, phone with a labelled sample report.
- CTA: Try a free sample report.
- Disclosures: D1, D2, D5. Proof: C1, C3, C4. Note: no urgency or "should I worry" framing. Status: Draft.

**TT3, "Same report, plain words"**
- Hook: "Left: what the lab sends. Right: the same numbers in plain words."
- Script: Voiceover reads one sample line and its plain-word version.
- Visual: split screen of the same synthetic report.
- CTA: Try a free sample report.
- Disclosures: D1, D2. Proof: C1, C2. Status: Draft.

**TT4, Creator (paid)**
- Hook: Creator, in their own true words: "I help my dad with his appointments."
- Script: "I'm partnering with FollowThrough Health. Here's a made-up report, so nothing about my dad's health is shown. It explains each line and gives me questions to ask. It's not a diagnosis; we still ask his doctor."
- Visual: creator on camera with screen inserts.
- CTA: Try a free sample report.
- Disclosures: D1, D2, D3. Proof: C1, C4. Status: Draft, counsel per script.

**TT5, "Your report stays on your phone"**
- Hook: "Where does your lab report go when you use this app?"
- Script: "It's read on your phone. It isn't uploaded unless you save or share it. And we never sell your data."
- Visual: simple animation.
- CTA: Try a free sample report.
- Disclosures: D1. Proof: C3, C6. Status: Draft.

## 8. Google Search ad groups (5)

Keyword targeting only; no remarketing, Customer Match or health audience lists (NT). Use phrase
and exact match on informational terms. Exclude disease and symptom terms ("kidney failure",
"cancer", "diabetes symptoms") and emergency terms. RSA headlines must be 30 characters or fewer
and descriptions 90 or fewer; check them in Google Ads before use.

| Group | Example keywords | Headlines | Descriptions | Landing page | Proof | Disclosures | Status |
|---|---|---|---|---|---|---|---|
| GS1 Understand lab report | "how to read lab results", "understand blood test report" | Lab Reports in Plain Words · Try a Free Sample Report · Read It on Your Phone | Each result next to the range your lab printed. Education only, not a diagnosis. · See how it works with a made-up report. No sign-up. | `/demo.html` | C1, C2, C5 | D1 | Draft |
| GS2 Lab terms | "what is egfr", "what does a1c mean", "tsh meaning" | Lab Terms Explained Simply · Free Lab Test Glossary · Explain Your Report Free | Plain-word definitions of common blood tests. Ask your doctor what yours mean. · Try a sample report to see every line explained. | `/glossary.html` | Glossary | D1, D5 | Draft ✚ |
| GS3 Caregiver prep | "questions for doctor about lab results", "prepare for doctor appointment parent" | Questions to Ask Your Doctor · One-Page Doctor Brief · For Families Helping a Parent | Questions written from the numbers on the report, plus a one-page brief. Education only. | `/demo.html` | C4 | D1, D5 | Draft |
| GS4 Private reader | "private lab report app", "lab results app no upload" | Your Report Stays on Your Phone · No Upload Unless You Choose · We Never Sell Your Data | Read on your device. Save or share only if you choose. Education only, not medical advice. | `/safety.html` | C3, C6 | D1 | Draft |
| GS5 DocBridge (clinicians) | "patient lab result explanation tool", "plain language lab results for patients" | Lab Explanations You Approve · Try a Synthetic Demo · Nothing Sent Without You | Draft, edit and approve patient-friendly lab explanations. Synthetic demo; not for real patient data yet. | `/#doctor-demo` | C8, C9, C10 | D4 | Draft |

## 9. YouTube Shorts scripts (5)

**YS1, "What's on a blood count?" (✚)**
- Hook: "Your blood count has about 10 numbers. Here's what three of them are."
- Script: Hemoglobin, white cells and platelets in plain words. "To see your whole report explained, try a sample first."
- Visual: sample report animation.
- CTA: Try a free sample report. Disclosures: D1, D2, D5. Status: Draft ✚.

**YS2, "From lab page to plain words"**
- Hook: "Watch a lab page turn into plain words."
- Script: Screen recording of the sample report being explained.
- CTA: Try a free sample report. Disclosures: D1, D2. Proof: C1, C2. Status: Draft.

**YS3, "Getting ready for a parent's appointment"**
- Hook: "Three things to bring to a parent's doctor visit."
- Script: "The report, your questions, and a short summary. FollowThrough Health helps with the last two."
- Visual: actors and a labelled sample.
- CTA: Try a free sample report. Disclosures: D1, D2, D5. Status: Draft.

**YS4, "Where does the report go?"**
- Hook: "Most apps upload your report. This one reads it on your phone."
- Script: Plain explanation of C3 and C6.
- Note: "most apps upload" is a comparative claim. Remove it unless proof exists; safer hook: "Your report is read on your phone."
- CTA: Try a free sample report. Disclosures: D1. Status: Draft, hook needs edit.

**YS5, "For clinicians: approve what your patient reads"**
- Hook: "A plain-language lab explanation, approved by you before your patient sees it."
- Script: Synthetic DocBridge demo: draft, edit, approve, patient page.
- CTA: Try the synthetic DocBridge demo. Disclosures: D4. Proof: C8–C10. Status: Draft.

## 10. LinkedIn DocBridge campaign concepts (5)

Target clinicians by job title or function (physicians, NPs, PAs, practice managers). LinkedIn may
restrict any health ad (HC). Never name clinics, health systems or "partners". No outcome,
time-saving or EHR claims. Status for all: Draft, pending counsel.

| # | Hook | Main copy | Visual | CTA | Audience | Proof | Disclosures |
|---|---|---|---|---|---|---|---|
| LI1 | "Patients read their labs before you call them." | "DocBridge drafts a plain-language explanation of each lab. You edit and approve it; the patient gets a private link with your name. Try it with synthetic labs." | Demo GIF (synthetic) | Try the synthetic DocBridge demo | Primary care clinicians | C8, C9, C10 | D4 |
| LI2 | "Nothing reaches a patient without your approval." | "Front desk can prepare drafts; only clinicians approve. Every view and approval is logged." | Approval screen (synthetic) | Try the synthetic DocBridge demo | Practice managers, physicians | C8, security page | D4 |
| LI3 | "Help us shape DocBridge." | "We're running evaluations with synthetic labs and want clinician feedback before any real-patient use." | Plain text card | Join the clinician evaluation waitlist | Clinicians | Onboarding guide | D4 |
| LI4 | "Your words, your tone." | "Choose friendly or formal tone, change any word, then approve. The automatic draft is kept beside your version." | Editor screen | Try the synthetic DocBridge demo | Clinicians | Product | D4 |
| LI5 | "What should a patient-friendly lab explanation say?" | Short post linking the 60-second synthetic demo and asking for comments. Organic thought-leadership post, no outcome claims. | Carousel of the synthetic patient page | Try the synthetic DocBridge demo | Clinicians | C10 | D4 |

## 11. Apple Search Ads and app stores

Not ready. Run Search Ads only after the App Store listing is corrected (register LA-07, §5.4) and
approved. Keywords must match the corrected metadata ("lab report explained", "lab results plain
words"). Never use disease keywords or competitor brand names.
