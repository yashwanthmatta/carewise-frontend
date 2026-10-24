# Agent task completion tracker

Update this at the end of every working session. Status categories, used exactly:
**COMPLETE** (all requirements implemented and verified) · **PARTIALLY COMPLETE** (some work finished,
requirements remain) · **BLOCKED** (needs unavailable access, an external action or an approval) ·
**NOT STARTED** (no meaningful execution).

Last updated: 2026-10-23.

---

## T1. Monitoring and automated checks

**Status: PARTIALLY COMPLETE.** The minute-level uptime requirement is BLOCKED on the owner's
external monitor account.

| Requirement | Done | Evidence |
|---|---|---|
| CI on every push and PR (website, backend, mobile) | ✅ | `frontend-ci.yml`, `backend-ci.yml`, `mobile-ci.yml`; green on every PR listed below |
| Production monitor: domains, redirects, TLS, rules version, API and database, live page smoke; opens or closes a `production-alert` issue | ✅ | `production-monitor.yml` (PR #102). Three dispatched runs passed on 2026-10-23, the latest at 02:19 UTC |
| Nightly synthetic API end-to-end | ✅ | backend `deploy-smoke.yml` (backend PR #39); dispatched runs passed |
| Weekly report issue | ✅ configured | `weekly-report.yml`; first scheduled run is Monday (not yet observed) |
| Dependency updates | ✅ | `dependabot.yml` in all three repos. Dependabot opened PRs on 2026-10-23, which shows it is working |
| Actions on supported Node 24 | ✅ | Frontend #105, mobile #43, backend #42. The Node 20 warning is gone from runs |
| 6-hourly agent check limited to read-only | ✅ | Scheduled task "FollowThrough Health checks (read-only)" updated 2026-10-23 |
| 5-minute uptime alerts | ⛔ BLOCKED | GitHub schedules are best-effort. Needs an external monitor (UptimeRobot or Better Stack) on the 3 URLs in `PROJECT-STATUS.md` |

## T2. Store readiness (iOS and Android)

**Status: BLOCKED** on owner accounts, signing, clinical and legal review, and device testing. All
code-side items are done.

| Requirement | Done | Evidence |
|---|---|---|
| Unused Android permissions removed | ✅ | mobile PR #40; `expo prebuild` shows only INTERNET |
| App Store icon without alpha | ✅ | mobile PR #40 |
| In-app purchase removed (Apple 3.1.1 / Play Billing), owner-approved | ✅ | mobile PR #44; `release:check` fails if checkout returns |
| Readiness checklists | ✅ | `carewise-mobile-app/docs/APP-STORE-READINESS.md`, `GOOGLE-PLAY-READINESS.md` |
| Apple Developer and Play Console accounts, EAS signing, TestFlight and closed test | ⛔ BLOCKED | Owner accounts |
| Real-device, VoiceOver and TalkBack test | ⛔ BLOCKED | Needs testers (`docs/device-test-session.md`) |

## T3. Website completeness walkthrough

**Status: COMPLETE.**

| Requirement | Done | Evidence |
|---|---|---|
| Crawl every page at desktop and phone widths | ✅ | 18 pages: no broken links, JS errors, overflow or placeholders. The one "Todo" hit is Spanish text |
| End-to-end flows | ✅ | 30 browser flow scripts (reports, PDF and scan, brief, Spanish, caregiver, auth, two-step sign-in, reminders, doctor links, DocBridge). All pass except two scripts that are themselves outdated (they test a now-locked setting and a blank-page artifact), not site defects |
| Unconfigured payments degrade gracefully | ✅ | "Payments open soon" instead of an error |

## T4. Billing foundation (no live charges)

**Status: PARTIALLY COMPLETE.** The server and website foundation is done and verified. Stripe
sandbox testing and the store integrations are BLOCKED on owner accounts. The prices and paid features
need owner approval.

| Requirement | Done | Evidence |
|---|---|---|
| Audit of existing billing | ✅ | `carewise-production-backend/docs/billing-architecture.md` §1 |
| Shared entitlement service across Stripe, Apple, Google and clinics | ✅ | `app/services/entitlements.py`, `GET /subscriptions/entitlements` (backend PR #43) |
| Essential features always free | ✅ | `ALWAYS_FREE`; test fails if a paid plan lists one |
| Locks off until the owner decides | ✅ | `CAREWISE_ENTITLEMENT_ENFORCEMENT` defaults to false |
| Idempotent Stripe events | ✅ | `billing_events` table; `test_a_retried_stripe_event_is_applied_once` |
| Renewal, failed payment, cancellation | ✅ | `test_renewal_and_cancellation_follow_stripe_subscription_status` |
| No duplicate paid plans | ✅ | 409 on the server (PR #43); the website explains where to manage the existing plan for Stripe, App Store and Google Play (frontend PR #108, browser test 6/6) |
| Store plan expiry | ✅ | `expires_at`; `test_store_subscriptions_end_on_their_expiry_date` |
| Production migration | ✅ | Render logs on 2026-10-23 at 02:17:54 show `0020 -> 0021`; live API smoke and production monitor passed afterwards |
| Lifecycle test plan | ✅ | `billing-architecture.md` §3a (12 scenarios, coverage marked) (backend PR #45) |
| Stripe test-mode end to end | ⛔ BLOCKED | Owner creates the Stripe account and sets keys in Render |
| Apple StoreKit 2 and Google Play Billing (or RevenueCat) | ⛔ BLOCKED | Owner developer accounts; build after the paid features are decided |
| Final prices and what Plus and Family unlock | ⛔ needs approval | Proposed $6.99 / $11.99; live code is still $7 / $12 |

## T5. Database network restriction (H2)

**Status: BLOCKED.** The setting can only be changed in the owner's Render dashboard; the available
tools can read it but not change it.

| Requirement | Done | Evidence |
|---|---|---|
| Evidence of private connectivity | ✅ (partial proof) | `render.yaml` uses the internal `connectionString`; database logs from 2026-10-21 to 23 show only `10.x` clients |
| Runbook with checks, a no-traffic rehearsal of the undo step, verification and rollback | ✅ | `carewise-production-backend/docs/runbooks/database-network-restriction.md` (backend PR #45) |
| Confirm the live connection string, rehearse, remove `0.0.0.0/0`, verify | ⛔ BLOCKED | Owner, following the runbook |

## T6. Clinical review and real-patient use

**Status: BLOCKED** on the clinician. The review pack, change record (.2→.5) and cover note are
ready (`docs/clinical-review-package.md`). DocBridge stays synthetic-only, and patient questions stay
locked on the server.

## T7. Legal, compliance and advertising review (legal agent)

**Status: PARTIALLY COMPLETE.** Every part that can be done without counsel, a clinician or
account owners is done and tested. Legal-page wording changes, clinical items and account settings
are **BLOCKED** on human approval (not legal advice; no approval is claimed).

| Requirement | Done | Evidence |
|---|---|---|
| Audit website, app, backend, legal pages and data flows | ✅ (source) | `docs/legal-advertising-review.md`. The live site could not be fetched from the agent environment; the repo's production monitor says live matches main |
| FDA, HIPAA, FTC, HBNR, TCPA, state law, ARL assessment with sources and dates | ✅ | Register §2, §5, §8 (checked 2026-10-23; only Apple's page could be opened directly) |
| Claim review: BLOCK / REVIEW / ACCEPTABLE WITH EVIDENCE, with wording, location, fix, proof, approvals | ✅ | Register §2 (LA-01 to LA-23) |
| Social and paid ad policy review; concept evaluations | ✅ | `docs/advertising-library.md` §3, §4 |
| Ad library: 10 IG, 10 FB, 5 TikTok, 5 Google Search, 5 YouTube Shorts, 5 LinkedIn | ✅ drafts | `docs/advertising-library.md` §5–§10 (all DRAFT, pending counsel) |
| Marketing privacy rules; analytics inspected for leakage | ✅ | Library §2; register LA-14 (no trackers), LA-15 (OTEL) |
| App Store / Play metadata consistency | ✅ drafts fixed | Mobile PR #45 |
| Safe copy fixes (no rules or legal pages changed) | ✅ | This PR: "AI draft" → "automatic draft"; synthetic-only DocBridge copy; "any"/"every"/"lifetime" claims |
| Tests that detect prohibited claims | ✅ | `scripts/claims_audit.mjs` (13 rules) + CI step; fails on the pre-fix copy (24 hits), passes now |
| Reminder call callback number (TCPA) | ✅ code | Backend PR #47 (said when `CAREWISE_REMINDER_CALLBACK_NUMBER` is set) |
| Checkout auto-renewal notice | ✅ code | Backend PR #47 (`custom_text`) |
| Legal-page corrections (encryption overclaim LA-02, vendor table, synthetic-only, disclaimer) | ⛔ BLOCKED | Exact text in register §6; needs counsel approval |
| Paid plans unlock nothing (LA-01) | ⛔ BLOCKED | Owner decision on plan contents or relabelling |
| Stripe ToS consent box, refund policy, cancel billing on account deletion | ⛔ BLOCKED | Counsel (Terms, refund) and owner (Stripe dashboard terms URL) |
| Urgency wording / FDA question (LA-04), Spanish wording | ⛔ BLOCKED | Clinician and regulatory counsel |
| Re-record DocBridge demo video without the "AI draft" label | Open | Owner or engineering |
| Continuous review | ✅ CI only | Claims check runs on every push and PR. No other scheduled legal monitoring exists |

Tests run 2026-10-23:
- Frontend: syntax, smoke, reference audit, claims check, cache version, 34 safety cases, OCR resolution, heading values, accuracy eval (68 reports, 100% value and flag accuracy), stress (2,000 reports).
- Backend: 130 pytest passed, ruff clean.
- Mobile: `release:check`, `store:check`, `review:check`, `ci:check` (typecheck).

PRs:
- Frontend: legal review PR on `claude/agent-legal` (this branch)
- Backend: https://github.com/yashwanthmatta/carewise-production-backend/pull/47
- Mobile: https://github.com/yashwanthmatta/carewise-mobile-app/pull/45

## T8. Doctor outreach: DocBridge pilot recruitment kit

**Status: COMPLETE.** The kit is built and checked. Sending anything is the founder's job.

**Assigned task:** Build a pilot recruitment kit the founder can use, published as one private
Claude artifact, with wording that matches what DocBridge really does.

**Requirements and result**

| # | Requirement | Result |
|---|---|---|
| 1 | Who to target first (practice types, roles, why) and legitimate places to find them, with no scraping | Done |
| 2 | First email under 120 words, three versions (physician, practice manager, personal contact), each with a small ask | Done (117, 112 and 112 words) |
| 3 | Follow-up emails for day 4 and day 10, short and easy to say no to | Done |
| 4 | Phone script: front-desk opener, who to ask for, 20-second pitch, voicemail | Done |
| 5 | Five-question interview guide for a 15-minute call, not a sales pitch | Done |
| 6 | Tracking sheet layout for logging contacts by hand | Done (21 columns, status list, copyable header row) |
| 7 | Publish as one private artifact | Done: https://claude.ai/artifact/Y1vRjDbsvM8iGxtEBuJpkq (private, owner only) |
| 8 | Follow-on (2026-10-24): replies for the next step: book the call, thank-you with pilot offer, pilot setup confirmation, "not now", waitlist welcome, LinkedIn note, honest answers to common questions | Done (Part 7 of the same artifact) |

**Source of truth checked:** the DocBridge section of `index.html` and
`docs/pilot-clinic-onboarding.md` on `main`. Where they differ, the kit follows the stricter
onboarding rules: made-up sample labs only, approved links go to clinic staff only during the
pilot, patient follow-up questions are off. The kit points doctors to the no-sign-in demo at
`followthroughhealth.com/#doctor-demo` (handled in `docbridge.js`).

**Tests run (headless Chromium, on the published page file)**

- No sideways scrolling at 390px and 1280px, in light and dark themes: pass.
- No script errors, and the right background in each theme: pass.
- Email word counts under 120 (first emails) and under 80 (follow-ups): pass.
- Tracking sheet: 21 columns in the table and in the copyable header row: pass.
- Copy buttons copy, or select the text when the clipboard is blocked: pass.
- Reply emails under 130 words (70 to 106), LinkedIn note under 300 characters (223), answers to
  common questions make no compliance or validation claims: pass.
- Everything you would send or say (emails, scripts, answers) passes the same claim rules as
  `scripts/claims_audit.mjs`, including "drafts are rule-based, not AI": pass (36 checks in all).
- Scripts say "made-up sample labs only", make no "HIPAA compliant", "clinically validated" or
  "proven" claims, and link to the demo: pass.

**Changed files in this repo:** `docs/agent-task-completion.md` (this file only). No served page
changed.

**Not done on purpose (hard rules):** no emails, calls or LinkedIn messages sent; no contact lists
built; no personal emails looked up.

**Open items for the founder (decisions, not blockers)**

- Trial length: the emails ask for a two-week trial with sample labs. The website offers a free
  30-day pilot. The shorter ask fits inside it. Change it if you want them to match.
- Add your business postal address to the email signature before sending cold emails (US
  CAN-SPAM rule).
- Website wording: resolved. The DocBridge section now says synthetic sample labs only (legal
  review, T7), which matches the kit.
- The DocBridge demo video still shows the old "AI draft" label (see T7). The kit tells you to
  mention this if you share the video.

This file is served publicly with the website, so this section holds status only. The drafts
themselves (emails, phone script, interview guide) stay in the private artifact.

---

## Pull requests this session (all merged after green CI)

- Frontend: #100, #101, #102, #105, #106, #108
- Mobile: #38, #39, #40, #43, #44
- Backend: #39, #42, #43, #45

## Approvals needed from the owner

1. What Plus and Family unlock, and final prices.
2. Any new data processor (crash reporting, RevenueCat).
3. Enabling live billing or entitlement locks.
4. App Store and Google Play submission.
5. Real-patient clinic operation (after the clinical review, BAAs and legal review).
6. Legal-page corrections in `docs/legal-advertising-review.md` §6 (counsel), and setting `CAREWISE_REMINDER_CALLBACK_NUMBER` to an answered number.
