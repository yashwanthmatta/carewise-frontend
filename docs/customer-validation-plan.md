# Customer validation plan

Written 22 Nov 2026. **No participant has been recruited and no session has been run.** Every number on this page is a target or a threshold, not a result. Never fabricate participants, quotes or survey answers.

It builds on `docs/usability-test-kit.md`: same consent script, same synthetic reports.

## What we need to learn

| Question | How we find out |
|---|---|
| Who struggles most with lab reports: caregivers or patients themselves? | Screener and interviews, comparing the two groups |
| What do they use today? | Interview: portal, ChatGPT, Google, calling the doctor, nothing |
| Where do they get confused? | Task sessions: errors, hesitations, time on task |
| Does FollowThrough solve it? | Task completion; the "could you explain this to the doctor?" check |
| Do they come back? | Return visits (aggregate counters) from the people who used it again with their own reports, at their choice |
| Would they recommend it, and would they pay? | Post-session questions, then the pricing experiments |

## Recruiting (target 50–100 people over days 31–60)

| Group | Target | Where (founder's own networks first; no paid ads before approval) |
|---|---|---|
| A. Adult children helping a parent | 30–50 | Caregiver groups and forums, community centres, personal networks |
| B. Adults reading their own results | 20–40 | The same channels, plus people with a recent annual check-up |
| C. Spanish-preferring (within A or B) | at least 10 | Community organisations |
| Older adults 65+ (within B) | at least 10 | Senior centres |

The screener has 5 questions and takes 2 minutes:
1. In the last 12 months, did you read lab results for yourself or for someone else?
2. Who for: me, a parent, a partner, a child, someone else?
3. How did you make sense of them? (multi-select)
4. How confident were you, 1–5?
5. Phone or computer; English or Spanish?

Exclude people who have already seen FollowThrough, and anyone working in healthcare (they go into a separate expert panel).

**Consent:** use the test kit's read-aloud consent.
- Taking part is voluntary and can stop at any time.
- Only synthetic reports are used.
- Never ask for a real report or a diagnosis.
- No recording without explicit consent.
- Notes are stored without names: use participant IDs P01…P99.

## Interview guide (15 minutes)

1. Tell me about the last time you got lab results, for you or someone else. What happened next?
2. What was hardest about understanding them?
3. What did you use to figure it out? What was good or bad about it?
4. Did you take questions to the doctor? How did you prepare?
5. If a tool helped with this, what would it have to do for you to trust it?
6. *(Only after the tasks)* Would you use this again for the next report? Why or why not?

## Task session (20 minutes, synthetic report, the person's own device)

| # | Task (read aloud) | Success means |
|---|---|---|
| 1 | "Add this sample report." | The report is explained without help |
| 2 | "Check that the LDL value matches the paper." | They find the value and the source line, and say whether it matches |
| 3 | "What does the LDL result mean for this person?" | They restate it correctly in their own words, with no false reassurance or alarm |
| 4 | "Where in the report did that number come from?" | They open the source line |
| 5 | "Save this report so you can find it later." | It's saved, and they can find it in History |
| 6 | "Find questions to ask the doctor." | They reach the questions and copy or print them |
| 7 | "Set a reminder for the follow-up test." | A reminder is created |

**Record per task:** completed (yes / with help / no), time, errors, and quotes about confusion.
**Record after the tasks:**
- ease, 1–7;
- "Would you use this for a real report?" (yes / maybe / no);
- "Would you recommend it?" (0–10);
- willingness to pay, using the pricing-experiments script.

## Minimal analytics (aggregate only, no health data)

`/product/events` already counts these: `report_explained`, `sample_opened`, `doctor_brief_opened`, `pdf_read`, `photo_read`, `spanish_used`, `listen_used`, `demo_*`, `early_access_opened`.

Not counted yet (roadmap B6):
- homepage → upload started;
- value checked (source opened);
- report saved;
- questions copied;
- reminder created;
- return visit.

These counters are daily totals by name and source only, with no IDs, no report text and no IP addresses (`product.py`). Only report numbers measured from real activity.

## Decision thresholds (set before any data exists)

| Signal | Continue | Narrow or change segment | Pivot or pause |
|---|---|---|---|
| Core-task completion (tasks 1–6, unaided) | ≥ 80% | 60–79% | < 60% after 2 rounds of fixes |
| Value-check task correct (task 2) | ≥ 90% | 75–89% | < 75%: a safety concern |
| "Would use for a real report" (yes) | ≥ 50% | 30–49% | < 30% |
| Real-world return with a second report within 60 days (of those who chose to try it) | ≥ 25% | 10–24% | < 10% |
| Segment difference (A vs B completion or intent) | — | Pick the stronger group | — |
| Would pay (see pricing doc) | ≥ 15% say "yes, at the stated price" | 5–14% | < 5% |
