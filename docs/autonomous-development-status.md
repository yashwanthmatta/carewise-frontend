# Development status (read this first on every run)

Last verified run: 2026-11-02, about 21:45 UTC.

## Repository state

| Repo | main | Working branch | Open PRs from this work |
|---|---|---|---|
| carewise-frontend | `216cd8c` (#133 merged) | `claude/carewise-api-project-jmxg7f` | #138: results order and PDF page view (CI running) |
| carewise-mobile-app | `507c00f` | `claude/carewise-api-project-jmxg7f` | #51: palette |
| carewise-production-backend | `9cd2ad3` | `claude/carewise-api-project-jmxg7f` | #55: field encryption and key rotation (CI green, needs independent review) |

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
- No scheduled task that writes code. Development happens only in sessions the owner starts.
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
2. Phone navigation: check that every bottom-tab destination is a working feature, then simplify the labels. Website: Home, Upload, History, Record, Account.
3. The page view for photos, using Tesseract line boxes.
4. Backend: patient- and clinic-scoped staff access (workstream 4 in `docs/security-hardening/implementation-status.md`). This starts after #55 merges, because the session can push only one branch per repo.
5. CI: dependency audit (`npm audit` / `pip-audit`) and a nightly axe scan of the result and upload screens.
