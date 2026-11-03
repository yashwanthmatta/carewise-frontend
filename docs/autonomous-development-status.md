# Development status (read this first on every run)

Last verified run: 2026-11-03.

## Repository state

| Repo | main | Working branch | Open PRs from this work |
|---|---|---|---|
| carewise-frontend | `216cd8c` (#133 merged) | `claude/carewise-api-project-jmxg7f` | #138: results order, PDF page view, History empty state, lab tracker data fixes |
| carewise-mobile-app | `507c00f` | `claude/carewise-api-project-jmxg7f` | #51: palette |
| carewise-production-backend | `9cd2ad3` | `claude/carewise-api-project-jmxg7f` | #55: field encryption and key rotation, plus care-team-only staff access (needs independent review) |

**Other agents' open PRs:**
- frontend #134: calendar reminder, sets the cache version to 206. It **collides with #138's 206**; whichever merges second bumps.
- frontend #137 and backend #54: Dependabot.

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
- No dependency-vulnerability job and no nightly accessibility scan in CI yet.

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
2. **Backend, after #55 merges:** fix the checkout price conversion. `subscriptions.py` uses `int(plan["monthly_price_usd"]) * 100`, so $6.99 would be charged as $6.00. Use `Decimal` and round to cents, with a test. No price changes without the owner's approval.
3. **Website:** a "Care team" screen (add, list and revoke clinicians) using the API from #55. ~~Your Data page~~ built on 3 Nov (Account → Your data: device and account counts, downloads that leave out sign-in tokens, recorded activity only, clear this device, delete account). Eval `your-data.mjs` runs in CI.
4. ~~Website: the page view for photos~~ Done on 2 Nov: "See it on your photo" (PR #138).
5. **Backend:** staff two-step sign-in enforcement, staged behind a setting.
6. **CI:** dependency audit (`npm audit` / `pip-audit`), secret scan, and a nightly axe scan.

## Automation now in place

- The scheduled task **"FollowThrough Health daily development"** runs every day at 04:23 UTC in this session. It keeps the open PRs healthy, then works this list. It never merges, deploys or changes production.
