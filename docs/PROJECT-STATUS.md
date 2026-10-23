# FollowThrough Health: project status

Last updated: 2026-10-23. Update this at the end of every working session. Only list things that
were checked; mark everything else unverified.

## At a glance

| Area | Status | Evidence |
|---|---|---|
| Website (followthroughhealth.com) | ✅ Live | GitHub live check 2026-10-23 01:15 UTC: both addresses 200; http→https 301; www forwards to the main domain; live rules `2026-10-20.5`; Render deploy matches main |
| Backend API | ✅ Live | Live smoke (sign-up, readiness with database) passes; 112 tests on main |
| Rules version | `2026-10-20.5` live (web and app identical on 8,032 reports) | Frozen review candidate `2026-10-20.2` is protected and unchanged |
| Clinical review | ⛔ Pending | Pack, .2→.5 change record and cover note ready (`clinical-review-package.md`) |
| Security | 🟡 Open items | `SECURITY-REVIEW.md`: database network access and the encryption decision are open |
| iOS | Build-ready, not submission-ready | `carewise-mobile-app/docs/APP-STORE-READINESS.md` |
| Android | Build-ready, not submission-ready | `carewise-mobile-app/docs/GOOGLE-PLAY-READINESS.md` |
| Clinic evaluation (DocBridge) | Synthetic-only | Patient pages labelled "Pilot demonstration"; patient questions locked on the server; links to clinic staff only (`pilot-clinic-onboarding.md`) |

## Automated checks (real infrastructure, not a chat session)

| What | Where | When |
|---|---|---|
| CI: syntax, smoke, accuracy (68 reports), 34 safety cases, heading checks, photo corrections, 10,000 random reports | `frontend-ci.yml` | Every push and PR |
| Backend tests, ruff, readiness | `backend-ci.yml` | Every push and PR |
| Mobile checks | `mobile-ci.yml` | Every push and PR |
| Production monitor: both domains, redirects, TLS expiry, rules version, API health and database, live page smoke; **opens a `production-alert` issue on failure and closes it on recovery** | `production-monitor.yml` | Hourly and nightly (GitHub runs schedules best-effort, often hours apart) |
| Nightly synthetic API end-to-end (one example.com account) | backend `deploy-smoke.yml` | Nightly |
| Weekly readiness report (posted as an issue) | `weekly-report.yml` | Mondays |
| Dependency and Action updates | `.github/dependabot.yml` in each repo | Weekly (mobile: security fixes only) |

**Not yet in place: minute-level uptime alerts.** GitHub's scheduler can't guarantee 5-minute
checks (the backend's "every 10 minutes" job actually ran every 3–5 hours). The owner should create a
free external monitor (for example UptimeRobot or Better Stack) with email alerts, checking every 5
minutes:
1. `https://followthroughhealth.com/`, expect 200
2. `https://carewise-api.onrender.com/health`, expect 200
3. `https://carewise-api.onrender.com/ready`, expect the body to contain `"database":true`

Note: GitHub turns off scheduled workflows in a repository with no activity for 60 days.

## Top verified release blockers (2026-10-23)

1. ⛔ **Clinical review not done** (.2 pack plus the .3–.5 changes). Owner and clinician.
2. ⛔ **Production database accepts connections from any address** (`0.0.0.0/0`). Owner, after confirming the private connection.
3. ✅ ~~Paid plans in the phone app use Stripe web checkout.~~ Resolved 2026-10-23 (owner approved): the app sells nothing; plans are sold on the website only (carewise-mobile-app PR #44). **Note:** no feature is locked behind a paid plan yet, so paid plans currently earn nothing. The owner needs to decide what Plus includes.
4. ⛔ **Apple Developer and Play Console accounts, and signing.** Owner.
5. ⛔ **No written AI-provider retention terms** (Anthropic). Owner.
6. 🟡 Saved results and lab values aren't app-encrypted (design ready, needs security review).
7. 🟡 No real-device, VoiceOver or TalkBack test yet (`device-test-session.md`).
8. 🟡 No crash reporting in the app (needs approval: new data processor).
9. 🟡 No minute-level uptime alerts (external monitor, above).
10. 🟡 Legal review of claims, privacy policy and app privacy answers.
