# Pricing experiments

Written 22 Nov 2026. **There is no revenue and no measured willingness to pay.** Today's plans are Free $0, Plus $7/month and Family $12/month (`/subscriptions/plans`). Stripe Checkout exists, but entitlement enforcement is **off**, so nothing is locked. No price, plan or charge changes without the founder's approval.

## Rules

1. **Never lock safety.** Reading the report, exact values, explanations, urgency messages and doctor questions stay free (`ALWAYS_FREE` in the backend's `app/services/entitlements.py`).
2. **No charge for anything that can't be delivered.** Sharing with siblings and caregivers is "coming later", lab testing isn't live, and the assistant is down. None of these can be sold.
3. **Experiments are transparent.** An interest button says "not available yet; join the list". It never takes card details.
4. **Fix wording first.** `/subscriptions/plans` still says "Explain any lab or scan report" and "Lifetime health record", both banned by `claims_audit.mjs`.

## Experiments (in order)

| # | Experiment | Who | Measure | Pass |
|---|---|---|---|---|
| P1 | Problem-value interview: "What would make this worth paying for?" (open question, then a ranking of: organising reports, history over years, family management, a human to talk to) | Validation participants | Ranked value | One option ranked top by ≥ 40% |
| P2 | Price comprehension: show the plan card and ask "What do you get for $7? What stays free?" | Same | Correct restatement | ≥ 80% understand that safety info is free |
| P3 | Van Westendorp four questions (too cheap / cheap / expensive / too expensive) | ≥ 30 participants | Acceptable price range | The range includes a price that covers cost (see below) |
| P4 | Transparent interest button on the History "over the years" view: "Plus: coming soon. Tell me when." | Real visitors (aggregate count) | Click rate per `report_explained` | ≥ 3% of explained reports |
| P5 | Paid pilot (**founder approval, after P1–P4**) | Opt-in users | Paid conversion, refunds, support time | Paid ≥ 2% of active users; refunds < 10% |

## Unit economics (assumptions only; replace each with a measured figure)

| Cost line | Assumption | Source | Status |
|---|---|---|---|
| Hosting (API + database + static site) | Free API plan today; a paid web service plus database is a fixed monthly cost | Render pricing page | **To verify** |
| AI per help-chat conversation | The provider's per-token price × average tokens per chat | Anthropic pricing page; real token counts once the key works | **To verify** |
| Photo reading (OpenAI), only if switched on | Per-image price | OpenAI pricing page | **To verify** |
| Reminder calls (Twilio), off today | Per-minute price | Twilio pricing page | **To verify** |
| Payment fees | Card processing percentage plus a fixed fee per charge | Stripe pricing page | **To verify** |
| Support | Founder hours per paying user per month | Measure from P5 | **To measure** |

**Gross margin** = price − (payment fees + AI + hosting share + support). Don't compute it until each line is verified. On-device reading costs nothing per report, which is the one structural cost advantage, and it's true only while reading stays on the device.

## What to report (only when measured)

- upgrade interest;
- paid conversion;
- refunds;
- support cost;
- payment, hosting and AI cost;
- gross margin;
- retention of paying users.
