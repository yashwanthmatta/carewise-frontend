# UI/UX redesign progress

Statuses: **COMPLETE**, **PARTIALLY COMPLETE**, **NOT STARTED** or **BLOCKED**. A screen is COMPLETE only when all of these hold:
- the code is in place
- its tests pass
- it has been checked at desktop and phone sizes
- it has an axe scan, reduced-motion support and screenshots
- it is in a pull request

Last updated: 2026-10-26.

| # | Screen | Website | Phone app | Evidence / remaining |
|---|---|---|---|---|
| 1 | Welcome and home | **COMPLETE** | NOT STARTED | `compare-desk-home.png`, `compare-phone-home.png`. Headline "Your health reports, explained clearly." Two actions; "Try a sample report" explains a sample in one tap. Remaining: the founder decides whether to shorten the long phone homepage. |
| 2 | Upload | PARTIALLY COMPLETE | NOT STARTED | Homepage upload card redone. The Upload screen gets the new buttons and inputs but has the old layout. Remaining: progress and cancel states, plus clearer file guidance. |
| 3 | Report processing | NOT STARTED | NOT STARTED | — |
| 4 | Report results | PARTIALLY COMPLETE | NOT STARTED | Three main actions plus More; calmer summary; result cards with labelled chips; one container on phones (`compare-phone-result.png`). Remaining: the order of sections, and the "All tests" and "Detected values" folds. |
| 5 | Original report evidence | PARTIALLY COMPLETE | NOT STARTED | "Show the line from your report" restyled with a 44px target. Remaining: a side-by-side source view. |
| 6 | Doctor brief | NOT STARTED | NOT STARTED | — |
| 7 | Health record and trends | PARTIALLY COMPLETE | NOT STARTED | Internal follow-up codes are no longer shown in History. Remaining: layout and charts. |
| 8 | Reminders | NOT STARTED | NOT STARTED | — |
| 9 | Account and privacy (sign in) | **COMPLETE** | see mobile PR | `compare-*-account.png`, `after-*-signed-in.png`. Tabs, show password, forgot password, busy state, signed-in view, privacy controls. `scripts/eval/sign-in.mjs` (55 checks) runs in CI. Also checked against the real backend code locally: sign up, wrong password, sign in, duplicate email. |
| 10 | DocBridge | NOT STARTED (gets the new tokens) | — | — |
| — | Design system | **COMPLETE (v3)** | mirrored | `ui.css`, `docs/followthrough-design-system.md` |
| — | Dark mode | BLOCKED | — | Needs the older `styles.css` layers removed first; see the audit. |

## Checks run for the first pull request

All of these were run locally against this branch:

| Check | Result |
|---|---|
| Frontend smoke test | passed |
| Claims audit | passed |
| CSP meta check | passed |
| CSP browser checks (with headers, and meta only) | no violations |
| Sign-in | 55 checks passed |
| Share-packet PDF | passed |
| Visit settings demo | passed |
| Safety cases | 34 passed |
| OCR correction | passed |
| Headings | passed |
| Repeat and misread values | passed |
| Help answers | passed, after updating the help text |
| Read-aloud | 36 cases passed |
| Report accuracy (68 reports, 200 tests) | 100% read, value and flag accuracy |
| Full-site browser check (`live-site.mjs`, run against the local build) | 13 of 13 passed |
| axe-core | no violations on 4 screens at 2 sizes |

## Needs a person or an approval

- A usability test with 5 real users. The script is in `docs/mobile-ux-testing.md`.
- Testing on physical iPhone and Android devices: VoiceOver, TalkBack, large text, and Safari video playback.
- A product decision on shortening the phone homepage, which means removing marketing sections.
- Spanish: the new sign-in text is English, like the rest of the site's controls. The report explanations stay bilingual.
