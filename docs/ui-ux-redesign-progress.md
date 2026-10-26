# UI/UX redesign progress

Statuses: **COMPLETE**, **PARTIALLY COMPLETE**, **NOT STARTED** or **BLOCKED**. A screen is COMPLETE only when all of these hold:
- the code is in place
- its tests pass
- it has been checked at desktop and phone sizes
- it has an axe scan, reduced-motion support and screenshots
- it is in a pull request

Last updated: 2026-10-26 (third round: results rebuilt, simpler upload, warm white).

| # | Screen | Website | Phone app | Evidence / remaining |
|---|---|---|---|---|
| 1 | Welcome and home | **COMPLETE** | NOT STARTED | `after3-desk-home.png`. One upload action and one sample; the extra links (type the numbers, demo, early access) moved out of the hero. The 1-minute demo is now in the in-page links row. Warm white background. |
| 2 | Upload | **COMPLETE** | NOT STARTED | `compare3-phone-upload.png`. Order: "Whose report?", then one upload box and one "Try a sample report" card, then "Or type the results". Save and load moved under "Save or load reports". The duplicate privacy line is hidden from view (screen readers still hear it). The reading card scrolls into view above the phone tab bar. `upload-reading.mjs` (16 checks). |
| 3 | Report processing | **COMPLETE** | NOT STARTED | The same reading card covers PDF, photo and scanned-PDF reading, with page-by-page progress for scans. Explaining is instant on the device, so there is no separate wait screen. |
| 4 | Report results | **COMPLETE** (pending the usability test) | NOT STARTED | `compare3-phone-result*.png`, `after3-desk-result.png`. One surface, no nested boxes. The summary card has a quiet count meter (the same numbers it states in words). Compact result cards show the name, label, value, the lab's range and what it means; "More about this result" opens what the test is, the doctor question and the line from the report. Next steps are numbered cards. The calendar reminder and "Numbers read from your report" (was "Detected values") fold away. Neutral safety note and feedback box. |
| 5 | Original report evidence | PARTIALLY COMPLETE | NOT STARTED | The line from the report now sits in each card's "More about this result". Remaining: a side-by-side view of the original page for PDFs. |
| 6 | Doctor brief | NOT STARTED | NOT STARTED | — |
| 7 | Health record and trends | PARTIALLY COMPLETE | NOT STARTED | Internal follow-up codes are no longer shown in History. Remaining: layout and charts. |
| 8 | Reminders | NOT STARTED | NOT STARTED | — |
| 9 | Account and privacy (sign in) | **COMPLETE** | **COMPLETE**, pending a device check (yashwanthmatta/carewise-mobile-app#49: tabs, show password, reset step, clear messages, signed-in view; `compare-app-account.png` there) | `compare-*-account.png`, `after-*-signed-in.png`. Tabs, show password, forgot password, busy state, signed-in view, privacy controls. `scripts/eval/sign-in.mjs` (55 checks) runs in CI. Also checked against the real backend code locally: sign up, wrong password, sign in, duplicate email. |
| 10 | DocBridge | NOT STARTED (gets the new tokens) | — | — |
| — | Design system | **COMPLETE (v3)** | mirrored in `src/theme.ts` | `ui.css`, `docs/followthrough-design-system.md` |
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
| Upload reading card and result order | 16 checks passed |
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
