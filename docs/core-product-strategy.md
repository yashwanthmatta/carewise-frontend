# Core product strategy

Written 22 Nov 2026 in response to the founder's "five sharks" review. Every row below was checked against the three repositories on that date. **No customer evidence exists yet**, so every "demand" judgement is "not demonstrated", not "no demand".

## The one product

**Upload a report → check what was read → understand each result → prepare for the doctor visit → keep track of the follow-up.**

Ask of every screen: does it help someone finish this flow more safely, accurately, quickly or confidently? If it doesn't, it leaves the primary navigation.

## Feature inventory

Key to the verdicts:
- **E:** essential to the core flow.
- **O:** optional.
- **I:** incomplete.
- **D:** no demonstrated demand.
- **R:** needs clinical or regulatory approval before launch.
- **C:** adds complexity out of proportion to its value now.

| Feature | Where it lives | State today | Verdict | Action |
|---|---|---|---|---|
| Report reading on the device (paste, PDF, photo) | `script.js` reader; `upload-reading`, `report-edge-formats`, `ocr-*` evals | Live. 68 synthetic reports, 200 tests, 100% read / value / flag | **E** | Keep. Validate on real (consented) report layouts |
| "What was read": exact value, unit, range and source line | Result cards, "All tests", "Find a result" | Live | **E** | Keep. Make *verify* an explicit step (see roadmap B3) |
| Plain-language explanations and urgency labels | Rules `2026-10-20.8` | Live, **not clinician-reviewed** (the review package is frozen at `.2`) | **E + R** | Keep, but this is the main clinical liability. Clinician review is the top priority |
| Questions for the doctor and the visit brief (print/PDF) | "Questions for your doctor", "Print questions for your visit" | Live | **E** | Keep. This is the most distinctive part of the flow |
| Save to History on the device; delete; Your data | History, Your data | Live | **E** | Keep |
| Reminders (on-screen, saved to account) | `reminders.js`, `/reminders` | Live | **O** | Keep, but simple. Its tie to the follow-up step is still to be shown |
| Reminder **phone calls** (Twilio) | `/reminders/voice/*`; `reminder_calls` flag | Built, off | **D + C** | Keep off; out of the navigation |
| Read-aloud (Listen) | Web and app (mobile #56) | Live on web; app on main, untested on a device | **O** | Keep. An accessibility value to test with older users |
| Spanish | Web and app | Live | **O** | Keep. It's cheap, and possibly a segment signal (see validation plan) |
| AI Health Guide chat | `/assistant/chat` | **Down since at least 18 Nov** (Anthropic key rejected). Medicine reference holds names only | **I + R** | Leave it out of the core promise until it answers reliably and a clinician has reviewed it |
| Patient profile, care plans, diet/habit "recommendations", insurance matching | `/care-plans`, `/recommendations/ai`, `/insurance/match` | Built; the recommendation and insurance routes return fixed text | **D + R + C** | Hide from any primary path. These read as medical or financial advice with no review behind them |
| Doctor search | `/doctors/search` | Built | **D** | Out of the navigation |
| Lab trends / tracker | History trends, `/lab-trends` | Live | **O** | Keep. It's the retention hypothesis, so test it |
| Share with my doctor (expiring link) | `/shares` | Live | **O** | Keep; it supports the visit step |
| Family / caregiver profiles | "Whose report?" (Me / Mum / Dad) | Labels only; family plan sharing is "coming later" | **O + I** | Keep the labels; don't sell the plan yet |
| DocBridge clinic tool | `/clinics/*`, `#docbridge`, "For clinics" in the top nav | Built. **Pilot: de-identified/sample labs only**; no BAA | **D + R + C** | Remove "For clinics" from the top navigation until a BAA and a pilot clinic exist |
| Lab testing (ordering) | `lab-testing.html`, "Lab testing" in the top nav, `LAB_TESTING_LIVE` | Not live; synthetic stage 1 only | **R + C** | Remove "Lab testing" from the top navigation. The page stays reachable, clearly "not available" |
| Subscriptions (Free / Plus $7 / Family $12) | `/subscriptions/*`, Stripe | Built; entitlement enforcement **off** | **I + D** | No price changes or new tiers. See pricing-experiments.md |
| Social sign-in (Google / Apple / Microsoft) | `/auth/oidc/*` | Built, hidden until configured | **C** | Pause. Email sign-in is enough for validation |
| Two-step sign-in, staff two-step requirement | `/auth/two-factor/*` | Built; the staff requirement is off | **E** (security) | Keep; turn the staff requirement on before any staff exist |
| Homepage photo slots | `photos.js` | No photos | **O** | Pause; no more homepage redesigns |
| Mobile app (Expo) | carewise-mobile-app | Not in any store; no device testing | **I** | Hold new features; finish device tests (`docs/device-test-session.md` in the app repo) |

**Wording found in the backend that breaks the frontend claims rules.** `/subscriptions/plans` still says "Explain any lab or scan report" and "Lifetime health record". `scripts/claims_audit.mjs` bans both, but it only checks the frontend. Fix it before any paid launch (roadmap B9).

## Navigation changes recommended (founder to approve)

- **Top navigation:** keep "How it works", "What it reads" and "Pricing". Move "Lab testing" and "For clinics" to the footer, labelled "not available yet" and "pilot only".
- **App tab bar** (Home · Upload · History · Record · Account): keep it.
  - "Record" holds the profile, care plans and medications. Its value to the core flow is unproven.
  - Ask about Record in the usability sessions before changing it.
- **Unlaunched items stay feature-flagged and are not deleted:** reminder calls, social sign-in, lab testing, patient Q&A, entitlement enforcement and inbound email.

## Paused (no new work without new evidence)

- AI doctor animations or avatars.
- Lab integrations without a signed partner.
- New subscription tiers or price changes.
- More social sign-in.
- Extra dashboard features.
- Any health score.
- New experimental medical AI features.

## Recommended first customer segment

**Adult children (roughly 35–65) who help an ageing parent understand lab results and prepare for doctor visits.**

Why this segment:
- The product already has "Whose report? Me / Mum / Dad".
- It already has the doctor brief, read-aloud and Spanish.
- The existing test kit already recruits this group.

The challenge to this choice:
- **Untested:** no evidence yet that this group feels the pain more than patients themselves do.
- **Behaviour:** caregivers may use the parent's own portal (MyChart) rather than a new tool.
- **Access:** the parent's report must be shared with the caregiver first, a step outside the product.

The validation plan tests this segment against "patients reading their own results". The 90-day decision picks one.

## Positioning (only verified capabilities)

> For people helping a parent make sense of lab results, FollowThrough reads the report on their own device, shows every value exactly as the lab printed it with the line it came from, explains each one in plain English or Spanish, and turns the results into a short list of questions to take to the doctor.

It doesn't diagnose, doesn't replace the doctor, and isn't clinically validated yet. Say all three wherever the claim appears.

| What we say | Verified by | Easy to copy? |
|---|---|---|
| Read on your device; nothing uploaded unless you save | Reader runs in the browser; privacy page | **Yes**: any client-side app can do it |
| Exact value, unit, lab range and source line | Evals `run-eval`, `heading-values`, `report-journey` | **Moderately**: the hard part is reliable reading of messy layouts, which our evals cover only synthetically |
| Questions for the doctor and a printable visit brief | `report-questions`, `share-packet-pdf` evals | **Yes**, in principle; the workflow framing is the asset |
| English and Spanish | `results-groups` and the Spanish journey checks | **Yes** |
| Read-aloud with the values said correctly | `speech-cases` (36 cases) | **Yes** |
| Family labels (Me / Mum / Dad) | UI | **Yes** |

**The honest conclusion:** none of these is defensible alone. A moat would have to come from proven trust:
- clinician-reviewed rules;
- measured reading accuracy on real layouts;
- a workflow caregivers return to.

None of that exists yet.
