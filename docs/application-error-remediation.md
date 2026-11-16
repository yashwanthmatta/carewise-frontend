# Application error remediation

The tracker for errors found in FollowThrough Health. Every row is a defect that was reproduced or seen in real evidence (logs, screenshots, test output), not a guess. "No issue found" in the scope table means the check ran and found nothing; it does not mean the area is free of errors.

**Statuses:** CONFIRMED, IN PROGRESS, FIXED — NOT VERIFIED, VERIFIED FIXED, BLOCKED, REQUIRES HUMAN REVIEW.

**Severity:**
- **P0:** patient data exposure, data corruption, unauthorised clinical access, medically consequential wrong data, an active incident, a full outage.
- **P1:** a core workflow broken, major sign-in failure, persistent data error, high-risk vulnerability.
- **P2:** secondary defects, accessibility barriers, important UX bugs.
- **P3:** cosmetic.

**"VERIFIED FIXED"** means a test reproduces the old failure and passes after the fix, and CI passed on the PR. A fix that has merged but is not yet live is marked as such.

## Errors

| ID | Severity | Repo | Feature | Root cause | Evidence | Fix | Tests | PR | Status | Waiting on |
|---|---|---|---|---|---|---|---|---|---|---|
| E-001 | P1 | backend (configuration) | AI Health Guide online answers | The Anthropic API key set in Render is rejected. Every `/assistant/chat` call raises `AuthenticationError` and returns 502. | Render logs: `assistant request failed: AuthenticationError`, 16 times between 10 and 16 Nov (the latest at 16:30 UTC on 16 Nov). The website falls back to its built-in answers, so users see short canned replies, not an error. | None in code: the fallback already works (`help.js`, `replyFor`). The key must be replaced in Render. | n/a | n/a | BLOCKED | **Owner:** create a new key in the Anthropic console and set `ANTHROPIC_API_KEY` on the Render web service. Claude does not change Render settings. |
| E-002 | P2 | frontend | "Welcome back" summary | Reports saved before early November keep only the count sentence, not each result. The summary listed "results to talk about" from the empty list, so it said "7 of 10 results outside the lab's range" and then "No results outside the lab's range in this report." | The owner's screenshot of the live site, 16 Nov. Reproduced locally with a made-up older report. | An older report now shows its own count, says it was saved before each result was kept, and offers "Open the report". It never says "no results" under a count. | `home-dashboard.mjs`: new check with a made-up older report (desktop and phone). | [#164](https://github.com/yashwanthmatta/carewise-frontend/pull/164) | FIXED — NOT VERIFIED (waiting on CI and merge) | Owner: merge #164 |
| E-003 | P3 | frontend | Shared summary, clinic packet and info pages | `share.css` used fonts that the pages never loaded, so they fell back to Georgia and system fonts. The glossary also pointed at a stylesheet version from long ago (146), so returning visitors could get old styles. | Screenshots `before-share-1440.png`, `before-about-1440.png`. `glossary.html` linked `share.css?v=carewise-product-146`. | Font link added to the nine pages that use `share.css`. Glossary now on the current version. Restyled to match the site. | Page crawl: no script errors, missing files, broken links or sideways scroll on 16 pages at 1440, 1024, 768 and 390 px. CSP check passes. | [#164](https://github.com/yashwanthmatta/carewise-frontend/pull/164) | FIXED — NOT VERIFIED | Owner: merge #164 |

## Scope checked on 16 Nov, with no new error found

| Area | What ran | Result |
|---|---|---|
| Website pages | Playwright crawl of all 16 pages (`index`, info pages, `share`, `packet`, `legal/*`) at 1440, 1024, 768 and 390 px | No script errors, failed requests for site files, broken internal links, sideways scroll or unlabelled controls |
| Report reading | `run-eval.mjs` (68 made-up reports, 200 checks), `heading-values.mjs`, the 34 frontend safety cases | 100% read rate, value accuracy and flag accuracy. All safety cases pass |
| Backend | 239 pytest tests, ruff, `tests/static_readiness_check.py` on `main` (`b9b5f3c`) | All pass |
| Mobile | `scripts/ci_check.js` on `main` (`69c49fb`) | Passes. Emulator and real-device checks were not run in this session |
| Production, read-only | Render request logs for 5xx since 10 Nov; app logs for errors since 9 Nov; GitHub monitors (Production Monitor, Live Browser Check, Live Backend Smoke) | No 5xx request logs. The only recurring app error is E-001. All monitors green; no open `production-alert` issue |

## Not checked yet, and why

- **Google, Apple and Microsoft sign-in.** These need the real provider configuration and a test account. They are not marked working.
- **Stripe.** The Stripe connector in this session needs the owner to authorise it. No payment test was run, and nothing about prices or billing was changed.
- **SMS and phone reminders.** Not tested. Real people must never be contacted.
- **Real phones.** No physical-device testing was done.
- **The live site and API from this session.** The session's network does not allow `followthroughhealth.com` or `carewise-api.onrender.com`. Live checks come from the GitHub monitors and Render logs instead.
