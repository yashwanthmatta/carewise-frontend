# Competitive differentiation

Written 22 Nov 2026. This page describes alternatives in general terms from public knowledge and makes **no claim that FollowThrough is better** than any of them. Competitor features change, so re-check them before relying on a row.

## What people can already do

| Alternative | What it already solves well | Where it falls short for our use case (hypotheses to test) | Copyable by them? |
|---|---|---|---|
| General AI chat (ChatGPT, Gemini, Claude) | Free, instant explanations of pasted results in many languages | Needs a good prompt. May round or misread values. The values aren't traced to the source line. Uploads go to a third party. No visit prep or follow-up memory by default | Trivially |
| Patient portals (MyChart, lab apps such as Quest and Labcorp) | Official results with the reference range and flags; messaging the doctor | Explanations are often short or absent. A caregiver needs proxy access. Results are split across portals | Yes, if they choose to |
| Function Health and similar membership testing | Ordering broad lab panels, clinician-written summaries, tracking over time | Paid membership. Only their own tests, not the report you already have | N/A (a different business) |
| Report scanners / PDF readers | Pull text from a report | Little or no explanation or visit preparation | Yes |
| Personal health record apps (Apple Health records and others) | Store and chart results from connected providers | Weak at plain-language explanation and doctor questions | Yes |

## What FollowThrough actually does differently today (verified in code)

These are checked in the code. That doesn't prove users value them, and nothing here makes them hard for others to copy.
1. The report is read in the browser; nothing is uploaded unless the person saves it.
2. Every value is shown exactly as printed, with the lab's range and the source line ("Find a result", "All tests").
3. The results become a short list of questions plus a printable visit brief.
4. Built for helping someone else: "Whose report?", Spanish and read-aloud.

## Underserved needs (to test, not assumed)

| Hypothesis | How we'll know (see customer-validation-plan.md) |
|---|---|
| H1. Caregivers struggle more than patients to turn a report into a useful doctor conversation | Group A vs B task results and interviews |
| H2. People don't trust AI chat with exact numbers, and source-line traceability increases trust | Task 2 and 4 success; "what would make you trust it" answers |
| H3. People come back for the next report if the history and questions are already there | Second-report return rate ≥ 25% (validation plan) |
| H4. Spanish-preferring and older users are poorly served by the alternatives | Completion and intent in groups C and 65+ |

## What would create lasting value (none of it exists yet)

- **Clinician-reviewed rules** with a published validation summary. Hard to copy quickly, and it builds trust.
- **Measured accuracy on real, consented report layouts** across the common labs.
- **A follow-up loop people rely on:** history, the next visit's questions and reminders. Switching costs come from accumulated history, not features.
- **One narrow segment served very well**, rather than patients, clinics, labs and families at once.

A prettier website isn't defensibility.
