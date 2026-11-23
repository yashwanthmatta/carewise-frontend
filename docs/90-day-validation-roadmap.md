# 90-day validation roadmap

Starts when the founder approves it (day 1). Success is measured by:
- task completion and accuracy;
- reliability and security;
- retention, demand and unit economics.

It is **not** measured by lines of code, PR count, feature count or page count.

## Days 1–30: stabilise

- Restore the AI Health Guide: B1.
- Close security blockers: B2, B3.
- Prepare the clinical review: B4.
- Instrument the core flow: B6.
- Trim navigation: B7.
- Prepare research: B8.

## Days 31–60: validate

- Run 50–100 interviews and task sessions (`customer-validation-plan.md`).
- Run pricing P1–P4.
- Fix only what the sessions show.

## Days 61–90: decide

Apply the rule below and write the decision with its evidence in `docs/decision-day-90.md`.

| Outcome | Rule (all from measured data) |
|---|---|
| **CONTINUE** | Core-task completion ≥ 80%, value-check ≥ 90%, "would use" ≥ 50%, second-report return ≥ 25%, no open S1 clinical incident, security items 1, 4, 5b and 10 closed |
| **NARROW THE PRODUCT** | Completion ≥ 60% but only some steps are valued (for example the doctor brief is used and reminders aren't). Cut the rest |
| **CHANGE THE SEGMENT** | Group B (own results) clearly beats group A (caregivers), or the reverse |
| **PIVOT** | "Would use" < 30%, or return < 10%, after two fix rounds |
| **PAUSE EXPANSION** | Any S1 clinical incident unresolved, or security blockers still open; validation can continue, but no new features |

## One backlog

Status values: **To do**, **Owner**, **In PR** and **Done**.

**Five-shark answers:**
- **Pay:** would anyone pay for it?
- **Safe:** can it be delivered safely?
- **Sec:** is the data protected?
- **Comp:** why us over the alternatives?
- **Exec:** can we do it without hurting the core?

| ID | Problem | Evidence | Benefit | Risk | Owner | Acceptance | Test plan | Status | Five sharks |
|---|---|---|---|---|---|---|---|---|---|
| B1 | AI Health Guide down | `provider_auth_rejected` 18–22 Nov; smoke red | Core trust; ends a 503 for every user | L | Founder (key) → engineering (verify) | `/assistant/status` = ok; live "What is Dolo 650?" answer with no dosing; smoke green | Live synthetic smoke; assistant eval (budget approval) | Owner | Pay: indirect. Safe: yes if eval passes. Sec: no health data in the test. Comp: parity. Exec: 10 minutes |
| B2 | Weak sign-in key | Startup warning | Stops forged sessions | L (one forced sign-out) | Founder | Warning gone from the startup log | Render logs after deploy | Owner | All pass; mandatory |
| B3 | Database open, no backfill, backups unverified | `0.0.0.0/0`; runbooks | Basic data protection | M (production change) | Founder (+ reviewer) | Allow list closed; backfill verified; test restore done | Runbook checks; `/ready`; smokes | Owner | Mandatory before any growth |
| B4 | Rules unreviewed; pack stale (`.5` vs `.8`) | `clinical-validation-readiness.md` | Reduces the main liability | L | Engineering (pack), founder (recruit reviewer) | Pack regenerated at `.8`; a named clinician's verdicts recorded | Case CSV diff; sign-off file filled by the reviewer | Engineering done 23 Nov (pack `.8`, CI guard); clinician review: Owner | Safe: this *is* the safety work |
| B5 | Explicit "check the value" step | Core flow says *verify*; today it's implicit | Catches misreads; builds trust | L | Engineering | Each card offers "Matches my report / Doesn't match"; a mismatch is counted (aggregate) | Eval plus usability task 2 | To do (after B6 data) | Comp: differentiator H2 |
| B6 | Core funnel not measured | Missing events (validation plan) | Lets day 90 be decided on data | L | Engineering | Events for upload started, source opened, saved, questions copied, reminder created and return visit; aggregate only | Backend tests; frontend eval | Done 22 Nov (backend #64 merged; frontend #179), plus the founder metrics page | Exec: small |
| B7 | Navigation shows unlaunched services | "Lab testing" and "For clinics" in the top nav | Focus; no implied availability | L | Founder approve → engineering | Both moved to the footer with clear status | Homepage eval updated | To do | Comp: clarity |
| B8 | No research materials ready to run | — | Unblocks days 31–60 | L | Founder | Screener live (form), consent printed, synthetic reports ready | Dry run with 2 people | To do | Pay / Comp: the source of all evidence |
| B9 | Overclaiming plan text in the backend | "Explain any lab or scan report", "Lifetime health record" | Avoids misleading claims | L | Engineering | Wording fixed; claims audit covers backend strings | Backend test plus audit | Done (backend #64) | Safe and Sec: pass |
| B10 | Security page omits OpenAI | Privacy vs security page | Accurate disclosure | L | Engineering | OpenAI row added | Claims audit | Done (#179) | — |
| B11 | Free plan cold starts | 6+ restarts on 21 Nov | Reliability | L | Founder (billing) | Decision recorded | — | Owner | Pay: a cost; Exec: trivial |
| B12 | Mobile untested on devices | Blank sheet | Release readiness | L | Founder | Device sheet filled for 1 iPhone and 1 Android | `device-test-session.md` | Owner | Defer the store launch until day 90 |

**Deferred until evidence** (fails the Pay or Comp shark today): lab ordering, DocBridge expansion, reminder calls, social sign-in, health scores, new tiers, homepage redesigns, care plans, insurance matching, doctor search.

**Coordination:**
- Only one coding agent works per repository at a time.
- Security, clinical, billing and data-migration changes need an independent human review before merging.
