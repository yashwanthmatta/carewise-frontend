# Development status (read this first on every run)

Last verified run: 2026-11-12, daily run at 04:23 UTC.

## Repository state

| Repo | main | Working branch | Open PRs from this work |
|---|---|---|---|
| carewise-frontend | `b46ddc9` (#154 merged) | `claude/carewise-api-project-jmxg7f` | #156: Function-style redesign (homepage rebuild, every reachable app screen, DocBridge workspace, patient and info pages, new demo video) and History results over time. Green, mergeable, no review comments. Cache version 225. |
| carewise-mobile-app | `69c49fb` (#53 merged) | `claude/carewise-api-project-jmxg7f` | #52: Expo tooling advisories (lockfile only). Green, mergeable. The provider sign-in work waits for #52 to merge. |
| carewise-production-backend | `c653336` (#55 merged) | `claude/carewise-api-project-jmxg7f` | #56: secret scan in CI, staff two-step sign-in requirement (off by default), and from 11 Nov a checkout price test. Needs owner review. |

**Other open PRs:**
- frontend #155 (the owner's revert of #154) is now closed.
- Agent and Dependabot PRs: frontend #132 and #112; backend #51 and #57; mobile #48, #41 and #42.
- **Owner:** merge cache-version PRs one at a time. #156 uses 225.

## Automation that actually exists

| What | Where | Schedule |
|---|---|---|
| Frontend CI (tests, safety cases, accuracy, CSP, a11y-related checks) | `.github/workflows/frontend-ci.yml` | Every PR and push; Ubuntu 24.04 pinned |
| Live browser check, Audio QA | GitHub Actions | Daily |
| Production monitor | GitHub Actions | Several times a day |
| Weekly readiness report (issue) | GitHub Actions | Weekly |
| Backend CI, live backend smoke | Backend repo Actions | Every PR; daily |
| Read-only health check by Claude (no code changes, by the owner's rule) | Scheduled task "FollowThrough Health checks (read-only)" | Every 6 hours |

**Missing:**
- Backend has a weekly pip-audit job (`dependency-audit.yml`). Nightly accessibility scan: `accessibility-scan.yml` (from 9 Nov, once merged).

## Blockers needing the owner

1. **Render database** still allows `0.0.0.0/0`. Steps: `carewise-production-backend/docs/security-hardening/render-network-lockdown.md`.
2. **Backend #55:** independent review, then approval for the production backfill (back up the database first).
3. **Usability test with 5 people:** protocol and sheet in `docs/mobile-ux-testing.md`, status NOT RUN.
4. **Physical iPhone and Android checks.**

## Clinical gates (unchanged)

- No thresholds, urgency rules or medical wording changed in any open PR.
- Real-patient evaluation stays blocked.

## Next tasks, in order

1. Keep #138, #55 and #51 green; resolve the #134 cache-version collision when it happens.
2. ~~**Backend, after #55 merges:** checkout price conversion~~ Checked on 11 Nov: today's prices are whole dollars ($0, $7, $12) and the API schema types them as `int`, so `int(price) * 100` charges exactly the listed price. No billing code was changed. A new test, `test_checkout_charges_exactly_the_listed_monthly_price` (backend #56, commit 161ad7b), fails if a non-whole price such as 6.99 is ever added; this was confirmed by setting 6.99 temporarily, which the test failed, and then restoring the file. **If prices ever need cents:** switch to `Decimal` with rounding to cents first. That needs owner approval, because it changes billing.
3. ~~**Website:** a "Care team" screen (add, list and revoke clinicians) using the API from #55.~~ Built on 3 Nov in PR #140: Account → Care team (`#clinician-access`). It shows only when signed in, with a saved profile, and when the server has the API, so nothing appears until #55 is deployed. Eval `care-team.mjs` runs in CI. ~~Your Data page~~ built on 3 Nov (Account → Your data: device and account counts, downloads that leave out sign-in tokens, recorded activity only, clear this device, delete account). Eval `your-data.mjs` runs in CI.
4. ~~Website: the page view for photos~~ Done on 2 Nov: "See it on your photo" (PR #138).
5. **Backend:** staff two-step sign-in enforcement, staged behind a setting.
5a. ~~Website sign-in buttons and Sign-in methods~~ Built on 3 Nov (frontend PR from this branch): "Continue with Google / Apple / Microsoft" and Account → Sign-in methods. Both are hidden until the server lists a configured provider (backend #55). Eval `provider-sign-in.mjs` runs in CI. **Before switching on:** replace the text-only buttons with each provider's official button artwork (Google, Apple and Microsoft brand kits), and run a real sign-in in staging.
6. **CI:** ~~dependency audit~~ Partly done on 4 Nov:
   - **Backend:** pip-audit found 7 advisories in pypdf 6.21.2, which reads uploaded PDFs. The minimum is now 6.21.4, and a weekly `dependency-audit.yml` job runs pip-audit. Both are in backend #55.
   - **Mobile:** npm audit found 13 advisories (3 high) in Expo tooling. A lockfile-only update leaves 5 moderate (mobile #52).
   - **Secret scan (5 Nov):** a full-history scan of all three repos found no credentials. `scripts/security/secret_scan.py` now runs in Backend CI (backend #56).
   - ~~Nightly axe scan~~ Built on 9 Nov: `scripts/eval/a11y-scan.mjs` scans 21 screens and pages at phone and desktop size (axe-core 4.14.0, WCAG A/AA). It runs in Frontend CI on every PR and nightly in `accessibility-scan.yml`. The first scan found one serious issue, now fixed: the desktop "Need help?" button's accessible name did not contain its visible text (WCAG 2.5.3).
5b. **Staff two-step sign-in requirement:** built, off by default (`CAREWISE_STAFF_TWO_FACTOR_REQUIRED`, backend #56). ~~Website banner~~ Built on 8 Nov: Account shows "Turn on two-step sign-in to use your clinic tools" when `/auth/me` reports `staff_two_factor_needed`, links to Two-step sign-in, and hides once it is on. Shows nothing until #56 is merged, deployed and the setting is on. Eval `staff-two-factor.mjs` (14 checks) runs in CI.
5c. **Main red on 5 Nov:** #116 merged after #142 with the same cache version, 208. Frontend #143 bumps it to 209. **Owner:** merge cache-version PRs one at a time.

## Run on 12 Nov (daily, 04:23 UTC)
- **Open PRs:** frontend #156, backend #56 and mobile #52 are green, with no conflicts and no review comments.
- **Nightly accessibility scan, failed on 11 Nov:**
  - **Cause:** the runner could not resolve the Ubuntu package mirror while installing the browser's font packages (`Temporary failure resolving 'azure.archive.ubuntu.com'`, for about 10 minutes). The scan step never ran.
  - **The site was not at fault:** the same commit on main passed the night before and has passed every local run.
  - **Fix (in #156):** the scheduled browser installs (accessibility scan, live browser check, Audio QA) now retry up to 3 times, 30 seconds apart, and their time limits were raised to fit. The loop was checked under `bash -e`: it succeeds on attempt 1, 2 or 3 and fails after three failures.
  - Frontend CI is unchanged, because a person sees and re-runs it.
- **Since 11 Nov (in #156):**
  - phone header shows the brand only; tablet margins are wider
  - the DocBridge clinician workspace, the patient page and the info pages are in the new design
  - the homepage doctor demo video was re-recorded with `scripts/record-docbridge-demo.mjs`
- **Unblocked work left:** none that doesn't need the owner. Waiting on merges of #52, #56 and #156, and on the owner items above.

## Run on 11 Nov (daily, 04:23 UTC)
- **Open PRs:** frontend #156, mobile #52 and backend #56 are all green with no merge conflicts and no review comments.
- **Next task 2, price conversion:** checked; there is no bug at today's prices. A guard test was added to backend #56. Backend tests: 237 passed, and ruff and readiness pass.
- **Since the 9 Nov run (in #156):** the Function-style homepage rebuild, and a styling-only pass on every reachable app screen:
  - Results, Upload, the original-report evidence and the doctor brief
  - History, Record, Reminders, DocBridge and the signed-in Account view

  Values, wording, prices and clinical rules are unchanged; the evals check this. The write-up is `docs/function-style-complete-redesign.md`. The hidden legacy tools (meal planner and others) were audited and left alone.
- **Read-only checks** on 10 to 11 Nov: all green every 6 hours. The nightly accessibility scan ran on 9 Nov and passed.
- **Unblocked work left:** none that doesn't need the owner. The next code tasks wait on merges (#52 for mobile provider sign-in, #56 for staff two-step sign-in) or on owner assets (official provider button artwork).

## Run on 9 Nov (daily, 04:23 UTC)

- Main was green after #147 (cache 211, fixing the #145/#146 collision) and the later #148 to #150. Backend #56 and mobile #52 unchanged and green.
- Built the accessibility scan (task 6). Before: 6 serious findings (the help button, on every desktop app screen). After: 0 serious or critical, 0 moderate or minor, across 42 screen and size combinations.
- **Next task:** checkout price conversion with `Decimal` (backend; billing, so the owner approves before merging). Then mobile sign-in.

## Run on 8 Nov (daily, 04:23 UTC)

- Open PRs checked first: backend #56 and mobile #52 are green with no review comments; nothing to fix. The frontend branch had no unmerged work after #143, so it was restarted from main.
- Built the staff two-step sign-in notice (task 5b). Before: the eval's "notice shows" check fails on main. After: all 14 checks pass.
- Verified locally on this branch: smoke, claims audit, cache version (210), CSP meta and csp-check (with and without headers), run-eval (68 reports, 200 tests, 100% values and flags), safety cases (34), stress seeds 101 and 202, speech cases, and every eval in Frontend CI.
- **Next task:** nightly axe accessibility scan in CI (task 6). After that: checkout price conversion with `Decimal` (billing, needs the owner's go-ahead before merging) and mobile sign-in.

## Found and fixed on 3 Nov

- **"Your data" (PR #140) showed on every screen, not only under Account.** The view system shows a panel only when it is registered with its screen, and it wasn't registered. Your data and Care team are now registered with Account, and links straight to them open Account. The `your-data` eval now checks Home, Upload and History.
- **Name clash:** an old, hidden "care team contacts" panel still uses `care-team-*` ids. The new screen uses `clinician-access-*`.
- **Upload test race on CI:** the photo was read before Cancel landed. The test now holds the reader back for 4 s.
- **Main red after #134** (cache version collision with #138). PR #140 carries the 207 bump that fixes it.

## Automation now in place

- The scheduled task **"FollowThrough Health daily development"** runs every day at 04:23 UTC in this session. It keeps the open PRs healthy, then works this list. It never merges, deploys or changes production.
