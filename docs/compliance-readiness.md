# FollowThrough Health: compliance readiness (engineering view)

What the product does today, where data goes, and which items need an attorney or clinician.
Written by engineering from the code on 2026-10-20. **This is not legal advice or a compliance
determination.** A healthcare regulatory attorney and a licensed clinician must review it.

## 1. Draft intended-use statement (for attorney review)

> FollowThrough Health helps adults and family caregivers understand information in laboratory
> reports by showing the test values and the reference ranges printed on the report, plain-language
> educational explanations from reviewed public sources, and questions to discuss with a licensed
> healthcare professional. It is not intended to diagnose disease, recommend or adjust treatment,
> name medicines or doses, monitor patients, or replace professional medical judgment.

Checked against the product: the explainer never names a medicine or dose, never says a person
"has" a condition (A1C/BP use published category names with "a doctor confirms"), never picks a
repeat-test date, and labels itself education. Public pages contain no "diagnoses", "detects" or
"HIPAA compliant" claims (scan of all `.html` and `legal/` pages, 2026-10-20).

**For FDA review:** the explainer labels results against printed ranges and published categories,
flags critical values as "contact your doctor today", and suggests food and activity ideas from
AHA/ADA/NIH guidance. Whether any of these are device functions under the 2026 CDS guidance needs a
regulatory specialist. List of every rule: `docs/clinical-rules-for-review.md`.

## 2. Operating models

| Workflow | Likely HIPAA role (to confirm) | Current state |
|---|---|---|
| Person explains their own report (web, app) | Not a business associate (consumer app) | Live |
| Person saves reports, trends, reminders to an account | Consumer app; FTC Health Breach Notification Rule and state laws (CMIA, WA MHMDA) may apply | Live |
| DocBridge: clinic sends labs, clinician approves explanation | Business associate | Pilot only with de-identified or sample labs; no BAA signed yet |

## 3. Data flow (from the code)

| Data | Leaves the device? | Goes to | When |
|---|---|---|---|
| Report PDF, photo, typed text | No | Read in the browser or app | Every explanation |
| Report file and text | Yes | Render (API, Postgres) and AWS S3, encrypted | Only on "Save to my account" |
| Photo text (server) | Yes | OpenAI, if the server OCR key is set | Only for a photo saved to an account |
| Lab values for trends | Yes | Render | Only on "Save to trends" when signed in |
| Help chat question | Yes | Render → Anthropic; not stored | When the person sends a chat message |
| Latest result summary in chat | Yes | Render → Anthropic | Only if the person ticks "Share my latest result" (off by default) |
| Doctor share link | Yes | Render | Only on "Share with my doctor" |
| Feedback text | Yes | Render | Only when the person sends feedback |
| Usage events | Yes | Render | Event name only (e.g. "photo_read"); no report content |
| Reminder calls | Yes | Twilio | Says the caller's first name; never the medicine |
| Missed-reminder email | Yes | SMTP provider | Never includes the reminder label or medicine |
| Payments | Yes | Stripe | Card details never reach FollowThrough Health |
| DocBridge intake email | Yes | Cloudflare Email Worker → Render | Clinic pilot only |
| DocBridge follow-up questions | Yes | Render → Anthropic | Only if the clinic turns it on and the safety check passed |

The privacy policy lists these services (`legal/privacy.html`, "Services That Handle Your Data").

## 4. Vendor register (BAA / DPA status to confirm)

Render (hosting, database), AWS S3 (files), Anthropic (help chat, DocBridge Q&A), OpenAI (server
OCR, only if enabled), Twilio (calls), SMTP provider (email), Stripe (payments), Cloudflare (DNS,
inbound clinic email), GitHub (code; no patient data). **Before any clinic pilot with real patient
data:** BAAs with every vendor that receives PHI (Render, AWS, Anthropic, Twilio, email, Cloudflare).

## 5. Safety controls in place

- Values come from the report only; a structured row per test (name, value, unit, printed range,
  status) feeds the summary, cards, All tests, doctor brief and app, so they cannot disagree.
- No language model decides values, ranges or urgency in the explainer: it is rule-based. The help
  chat (Anthropic) has a safety prompt and treats the report summary as data.
- Critical values and urgent symptoms → "contact your doctor today", no exercise plan.
- Photo numbers that may be misread → "Check this number" until the person confirms; every photo
  result says to check each number.
- Results with no printed range are labelled "compared with a common guide" and not counted as
  outside the lab's range.
- Every explanation carries `EXPLANATION_RULES_VERSION` (shown in the copied summary and doctor brief).
- **Safety switch:** setting `CAREWISE_REPORT_EXPLANATIONS_PAUSED=true` on the API (Render) makes the
  website stop showing explanations and tell people to talk to their doctor, within one page load.
  (The mobile app does not read this switch yet; add before the app ships.)
- Automated checks: `scripts/eval/run-eval.mjs` (68 vetted reports), `scripts/eval/stress.mjs`
  (1,000,000 generated reports run with 0 errors; `--hard` adds missing units and ranges, previous
  results and handwritten-style notes; `--pdf` and `--photo` use real PDFs and OCR), including a
  false-reassurance check (headline count must match the truth on every report).

## 6. Open items that need people

| Item | Owner |
|---|---|
| Approve the intended-use statement; FDA applicability of each function | Regulatory attorney / FDA specialist |
| HIPAA, FTC HBNR, CMIA, WA MHMDA, CCPA applicability | Healthcare privacy attorney |
| Review privacy policy, terms, consent flows | Attorney |
| Sign off `docs/clinical-rules-for-review.md`; build a clinician-labelled test set | Licensed clinician |
| Native-speaker medical review of Spanish | Medical translator |
| BAAs with vendors and clinics | Founder + attorney |
| Incident response plan, security risk assessment, breach procedure | Founder (template), attorney review |
| Accessibility audit (WCAG 2.2 AA) and usability test with older adults | Accessibility tester, real users |
| Tech E&O and cyber liability insurance | Broker |
