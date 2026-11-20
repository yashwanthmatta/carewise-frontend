# Development status (read this first on every run)

Last verified run: 2026-11-17, daily run at 04:23 UTC.

## Repository state

| Repo | main | Working branch | Open PRs from this work |
|---|---|---|---|
| carewise-frontend | `01ec0ec` (#163 merged) | `claude/carewise-api-project-jmxg7f` | #164: "Welcome back" on paper, the older-report fix, the shared, info and legal pages restyled, the error tracker and the report-format test. Cache version 233. Green, mergeable. |
| carewise-mobile-app | `69c49fb` (#53 merged) | `claude/carewise-api-project-jmxg7f` | #52: Expo tooling advisories (lockfile only). Green, mergeable. Provider sign-in and the mobile restyle wait for #52. |
| carewise-production-backend | `b9b5f3c` (#58 merged, live on Render) | `claude/carewise-api-project-jmxg7f` (at main) | None. #56 and #58 merged. |

**Other open PRs:**
- frontend #155 (the owner's revert of #154) is now closed.
- Agent and Dependabot PRs: frontend #132 and #112; backend #51 and #57; mobile #48, #41 and #42.
- **Owner:** merge cache-version PRs one at a time. The dashboard PR uses 233.

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

0. **Help chat AI key is rejected** (every `/assistant/chat` since 11 Nov returns 502 `AuthenticationError`). Create a new Anthropic key and replace it in Render → carewise-api → Environment.
0a. **Encryption backfill:** rows saved before 2 Nov may still be plaintext. Run the count-only report (`PYTHONPATH=. python scripts/security/encrypt_fields.py`), then back up and backfill if needed (`docs/security-hardening/encryption-migration.md`).
0b. **Privacy policy wording (counsel):** it says reminder times are stored encrypted; they are not. Proposed text is in `docs/human-quality-product-review.md`.
1. **Render database** still allows `0.0.0.0/0`. Steps: `carewise-production-backend/docs/security-hardening/render-network-lockdown.md`.
2. **Backend #55:** independent review, then approval for the production backfill (back up the database first).
3. **Usability test with 5 people:** protocol and sheet in `docs/mobile-ux-testing.md`, status NOT RUN.
4. **Physical iPhone and Android checks.**

## Clinical gates (unchanged)

- No thresholds, urgency rules or medical wording changed in any open PR.
- Real-patient evaluation stays blocked.

## Next tasks, in order (refreshed 18 Nov from the owner's latest priorities)

1. **Owner:**
   - merge frontend #170, backend #60 and mobile #52;
   - set the Anthropic key in Render (E-001);
   - supply or approve a way to produce the homepage photos (`docs/photography-briefs.md`).
1a. **Owner:** merge backend #61. The nightly smoke will then fail until the key is replaced; that is intended.
2. **Results dashboard (owner priority 2):**
   - ~~One button style and a summary card in the homepage style~~ Done on 18 Nov.
   - ~~Next: put the grouped summary (count, in/out bars) at the top of every report.~~ Done on 20 Nov.
   - Make the result rows read as one list on phones.
3. ~~**Lab testing pages (priority 3)**~~ Done on 18 Nov (#173).
4. **AI Health Guide (priority 4):** a useful, compact panel instead of the decorative avatar.
5. **Mobile app (priority 5):** apply the same tokens in the Expo app after #52.
6. **Trust (priority 6):** a privacy and security page whose claims are each checked against the code.

Earlier list, kept for reference:

### Earlier next tasks

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

## Run on 20 Nov (daily, 04:23 UTC)

**Open PRs:** backend #61 (the smoke check alerts on a broken helper) is green and waits for the owner. E-001 (the Anthropic key) is still open; read-only checks on all mains are green.

**Done (owner priority 2, results dashboard):** frontend PR, this branch.
- **Counts at the top of every report:** the top summary used to show a row of unlabelled dots. It now shows the number of tests, a within/outside bar with labelled counts, and the body areas with how many are outside in each.
- **Same counting rules:** the counts use the same rules as "All tests on your report", so the two always agree.
- **Wording:** no medical wording or labels changed. The old dot CSS was deleted from `ui.css` and `site.css`.

**Tests:**
- `results-groups.mjs` checks that the counts match the list, the body areas, and that the dot row is gone.
- All 37 evals pass, the 18-page crawl is clean, and the claims audit passes.
- Cache version 242.

## Run on 19 Nov (daily, 04:23 UTC)

**Merged and live since the last run (owner):**
- frontend #170, #171, #172 and #173 (homepage, dashboard twice, lab pages);
- backend #60 (chat reliability, lab testing stage 1);
- mobile #52.

**Outage still open: E-001.**
- Every chat request fails with `provider_auth_rejected`. The Anthropic key in Render is rejected.
- Only the owner can replace it.
- The nightly smoke recorded that failure and still passed, so nothing alerted.

**Done:** backend PR #61.
- The live smoke now fails, with the reason, when the helper is switched on but not answering.
- 4 new tests; the full suite passes (279).

**Read-only checks today:** all mains green.
- frontend accuracy 100% on 68 reports;
- 34 safety cases pass;
- backend 275 tests pass;
- mobile CI check passes.

## Run on 18 Nov (daily, 04:23 UTC)

**Open PRs:** all green.
- frontend #170 is green and mergeable;
- backend #60 is green;
- mobile #52 is green.

**Done (frontend, on #170's branch):**
- **Results screen buttons:** they now match the homepage. Primary buttons are terracotta; secondary buttons have a terracotta outline with 10 px corners. This was changed in `site.css`'s own rules, not as an extra override layer.
- **Shared terracotta:** the homepage now takes its terracotta from the app's `--fh-accent`, so the site and the app use exactly one value.
- **Report summary:** it is a card in the homepage panel style.
- **Bug fixed:** the numbers on "Questions for your doctor" were clipped at the left edge. The list indent is now 2.4em.

**Tests:**
- `design-quality.mjs` checks the indent and the button colour at 1440, 390 and 320 px.
- All 37 evals pass, including axe colour contrast, and the 18-page crawl is clean.
- No medical wording, labels or thresholds changed.

## Run on 17 Nov (daily, 04:23 UTC)

- **Open PRs:** frontend #164 is green and mergeable, with no review comments.
- **Task (UX and a cache bug):** the legal pages, the last pages still in the old style. The commit is added to #164, which shares the branch.
  - The pages loaded `styles.css` at cache version 20, many releases old, so they could show stale styles (E-005 in `docs/application-error-remediation.md`).
  - They now use `share.css` at the current version, with the site's fonts and the info pages' header.
  - Wording unchanged: a script checked each page's visible text, word for word.
- **Next:** wait for the owner on E-001 (the Anthropic API key in Render), on merging #164, and on whether doctors should see the score on the shared summary. Then E-004 (the mobile web preview, after mobile #52).

## Run on 16 Nov (daily, 04:23 UTC)

- **Open PRs:** frontend #163 (the opened report) is green and mergeable, with no comments.
- **Task (UX):** DocBridge's clinician workspace, in the same style. The commit is added to #163, which shares the branch. CSS only:
  - the six stats are on one ruled row (the orphaned sixth tile is fixed);
  - pricing is set as ruled columns;
  - notices have a left rule;
  - blocks are ruled;
  - the teal file picker is gone.
- **Next:** the printed doctor brief and the patient share page (`share.css`), then the info pages (about, FAQ, safety, support).

## 16 Nov (owner: "next")

- **Merged since the last run:** #162 (the app screens). Post-merge Frontend CI and the Live Browser Check are green.
- **Task:** the opened report in the homepage's style (CSS only).
  - Ruled parts replace the boxes.
  - Results are ruled rows.
  - Fixed: the step numbers were drawn twice, and one was cut off at the page edge.
- **Next:**
  - DocBridge's clinician workspace;
  - then the doctor brief print page, and the patient share page (`share.css`).

## Run on 15 Nov (daily, 04:23 UTC)

- **Open PRs:** none of ours. #161 was merged on 15 Nov at 01:24, and its post-merge Frontend CI and Live Browser Check are green. Mobile #52 is unchanged.
- **Task (UX):** brought the app screens (Upload, History, Record, Account) into the homepage's style. This is CSS only:
  - ruled sections instead of rounded panels with shadows;
  - 6 px corners;
  - small cards as ruled columns;
  - notes with a left rule;
  - "+ Add" as a link;
  - tabs with an underline;
  - the doubled header line removed.

  Before/after screenshots are in `docs/human-quality-review/`.
- **Next task:**
  - The opened report itself: the results cards and the doctor brief. It is the screen people spend the most time on, and it was last restyled in pass 3.
  - Then DocBridge's clinician workspace.

## Run on 14 Nov (daily, 04:23 UTC)

- **Open PRs:** frontend #161 ("Welcome back" summary rebuild) is green and mergeable, with no comments. Mobile #52 is unchanged. Since the last run, #158 and #159 (the homepage rebuild) were merged and are live; post-merge CI and the Live Browser Check were green.
- **Task:** two leftover audit items. Both fixes are added to #161, because it shares the branch.
  - The empty lab tracker on History said "nothing saved" twice. It now says it once.
  - The empty Record timeline pointed to a "sample 20-year history" button hidden in a closed section. It now has its own visible button.
  - `history-empty.mjs` has new checks for both. They failed on the old page (2 failures) and pass now.
- **Next task:** restyle the app screens (Upload, History, Record, Account) in the homepage's language: ruled sections instead of rounded panels and cards, and the same buttons. Most panels still use the older card style.

## Run on 13 Nov (daily, 04:23 UTC)

- **Open PRs:** frontend #158 is green and mergeable with no review comments. Mobile #52 is unchanged. Backend #58 was merged and is live (deploy `b9b5f3c`). The backend branch was fast-forwarded to main.
- **Task (privacy):** I checked the "stored encrypted" claim against the live backend code.
  - Only the listed health columns are app-encrypted. Dates, risk level and reminder times, days and time zone are plain on purpose.
  - The Your data card now says exactly that.
  - A new claims-audit rule, `blanket-encryption`, fails on the old sentence and passes on the new one.
  - The privacy policy has the same overstatement for reminder times. It goes to counsel, because legal pages wait for counsel; the proposed text is in the review doc.
  - The production backfill is not recorded as run; that is an owner action.
- **Also this session (13 Nov):**
  - The audit and craft pass. Tracker: `docs/human-quality-product-review.md`.
  - The help bot's clinician-style prompt (backend #58, merged).
- **Next task:** the remaining audit items:
  - History's duplicate empty-state lines.
  - The hidden "sample 20-year history" reference on Record.
  - The DocBridge video's first frame.

  After that, the homepage shortening, once the owner agrees.

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
