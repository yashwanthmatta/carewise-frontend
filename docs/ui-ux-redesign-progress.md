# UI/UX redesign progress

Statuses: **COMPLETE**, **PARTIALLY COMPLETE**, **NOT STARTED** or **BLOCKED**. A screen is COMPLETE only when all of these hold:
- the code is in place
- its tests pass
- it has been checked at desktop and phone sizes
- it has an axe scan, reduced-motion support and screenshots
- it is in a pull request

Last updated: 2026-10-26 (second round: upload and results).

| # | Screen | Website | Phone app | Evidence / remaining |
|---|---|---|---|---|
| 1 | Welcome and home | **COMPLETE** | NOT STARTED | `compare-desk-home.png`, `compare-phone-home.png`. Headline "Your health reports, explained clearly." Two actions; "Try a sample report" explains a sample in one tap. Remaining: the founder decides whether to shorten the long phone homepage. |
| 2 | Upload | **COMPLETE** | NOT STARTED | `compare2-phone-upload.png`, `after-phone-reading.png`. A reading card shows the file name, type and size, with real progress from the photo reader (a moving bar otherwise; no made-up percentages). Cancel guarantees nothing from that file is used. Drag and drop onto the Upload box; tips for a good read. `scripts/eval/upload-reading.mjs` (15 checks) runs in CI. |
| 3 | Report processing | **COMPLETE** | NOT STARTED | The same reading card covers PDF, photo and scanned-PDF reading, with page-by-page progress for scans. Explaining is instant on the device, so there is no separate wait screen. |
| 4 | Report results | **COMPLETE** (pending the usability test) | NOT STARTED | `compare2-phone-result*.png`. The plain-English summary comes first, then a "Take it to your doctor" bar (Doctor brief, PDF, Share, More), then "Results to talk about" with a count. Result cards show the number large with the lab's range under it, sentence-case labels and the doctor question in a quote box. The folds ("All tests on your report", questions) share one style with a count and a chevron. The language picker sits in the header. Checked in Spanish. |
| 5 | Original report evidence | PARTIALLY COMPLETE | NOT STARTED | "Show the line from your report" restyled with a 44px target. Remaining: a side-by-side source view. |
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
| Upload reading card and result order | 15 checks passed |
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
