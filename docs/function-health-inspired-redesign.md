# Function Health–inspired redesign

Goal from the founder: give FollowThrough Health the same feeling of premium quality, calm and
clarity as functionhealth.com, while keeping our own name, logo, teal, safety rules and features.

## How the reference was studied

The functionhealth.com site could not be opened from the build sandbox (its host is blocked by the
sandbox network). What was used instead:
- its public "How it works", "Pricing" and product pages, through web search results;
- the founder's own description of what they like ("everything in that").

Nothing was copied: no text, images, logos, code or layouts. The principles below are general ones
that their site is known for, applied in our own way.

## Principles taken

1. **Editorial type.** A large serif headline with lots of space around it, sans-serif body text.
2. **One clear action** at the top, and a quiet second one.
3. **Show the product, not claims.** Real screens and real explanations instead of slogans.
4. **Results grouped by body area** (kidneys, blood sugar…), each as a calm card: name, number,
   range, status and meaning.
5. **A short story**: a few steps from start to finish.
6. **Trust through facts**: how data is handled, what the product does and doesn't do.

## Our own decisions

- Same teal `#0F766E` (5.5:1 with white text), warm white page `#f6f4ef`, ivory sections `#fbf9f4`.
- Serif display font: Domine, which the site already loaded. No new font or script.
- Status words stay the lab-range words the app already uses ("Above the lab's range", "Within
  range"). The page says plainly that outside the range means "talk to your doctor", not "urgent".
- **No invented numbers, reviews, doctor names or press logos.** Function Health uses these. We will
  add them only when they are real.
- Example results use made-up numbers, and say so. Their explanations and doctor questions are the
  app's own text, and a test checks they stay the same as what the app shows.

## Screens

| # | Screen | State | PR |
|---|---|---|---|
| 1 | Homepage | **Done, merged**: new headline and lede, "Understand my report", serif headings, "See it before you upload" example results by body area (tabs), three steps instead of four, "Private by default" privacy and follow-up section, kidney-specific question in the hero preview. The duplicate demo strip and feature strip were removed. | #149 |
| 2 | Report results | **Done, in review**: "All tests on your report" grouped by body area (kidneys, heart and cholesterol, blood count…) with filters: All, Outside the lab's range, and each area. Reports with fewer than 6 results stay one plain list. Result cards: larger numbers, calmer cards. "Check these numbers", the line from the report, "See it on the report page" and every value, range and label are unchanged. Groups only arrange results on screen; they never change how a result is read. | this PR |
| 3 | Dashboard (signed-in home) | Not started. No health score will be added. | — |
| 4 | Trends | Not started. | — |
| 5 | Sign in, upload, processing, record, doctor brief, reminders, chat, account, plans, DocBridge | Not started in this redesign. Sign in, upload, processing and source evidence were redone in the earlier redesign (`docs/ui-ux-redesign-progress.md`). | — |
| 6 | Phone app | Not started. | — |

Google, Apple and Microsoft sign-in, and payments, are not shown as working anywhere new: none of this
work touched them.

## Before and after

Screenshots in `docs/function-health-inspired-redesign/` (desktop 1280 px and phone 390 px):
- `before-desk-hero.png` → `after-desk-hero.png`, `before-phone-hero.png` → `after-phone-hero.png`
- `before-desk-how.png` → `after-desk-how.png` (four steps → three)
- `after-desk-insights.png`, `after-phone-insights.png` (new section)
- Results: `before-*-all-tests.png` → `after-*-all-tests.png`, `before-*-result-cards.png` → `after-*-result-cards.png`

## Testing (results screen)

| Check | Result |
|---|---|
| `scripts/eval/results-groups.mjs` (new, in CI): every result shown with its exact value, range and label; groups; "Outside the lab's range", area and "All" filters; pressed state; screen-reader count; short report stays one list; no sideways scroll; no script errors | passes at desktop and phone |
| axe-core 4.10.2 on the whole results area | no violations, desktop and phone |
| Reduced motion | filter and card transitions off |

## Testing (homepage)

| Check | Result |
|---|---|
| `scripts/eval/homepage.mjs` (new, in CI): headline, tabs by click and arrow keys, one panel at a time, example text equals the app's text, three steps, no sideways scroll at 375 px | passes at desktop and phone |
| axe-core 4.10.2 on the hero, example results, steps and privacy sections | no violations, desktop and phone |
| Reduced motion | panel animation and card movement off |
| All other evals (report reading, safety cases, sign in, upload, OCR, questions, reminders and more), smoke test, claims audit, CSP checks | pass |
| Page weight | index.html +6.7 KB, ui.css +5.3 KB before compression; no new requests |
| Real iPhone or Android device | **not tested** |

## Still to do

- Report results screen, dashboard, trends, and the rest of the list above.
- The same look in the phone app (`carewise-mobile-app`, `src/theme.ts`).
- Real photos or illustrations of caregivers need licensed images (a cost, so your approval first).
- A usability test with a few real caregivers.
