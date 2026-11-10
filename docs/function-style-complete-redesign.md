# FollowThrough Health: Function-style website rebuild

Date: 10 Nov 2026. Branch `claude/carewise-api-project-jmxg7f` (frontend). PR: https://github.com/yashwanthmatta/carewise-frontend/pull/156

This document separates three things:

- **Implemented**: in the code on the branch.
- **Visually verified**: rendered in Chromium and looked at as a screenshot.
- **Pending**: not done yet.

## 1. Reference analysis

The three reference screenshots mentioned in the brief (footer, FAQ, comparison) were not attached to the conversation. So this analysis uses the live functionhealth.com page, rendered in Chromium, with computed styles read from it. No logos, text, illustrations or layouts were copied. Only the design language was used: type scale, spacing, palette behaviour and component shapes.

| Element | Measured on the reference | Our version |
|---|---|---|
| Display type | Light serif (weight 300), h1 80px / 72px line, h2 64px / 64px | Newsreader 300, h1 `clamp(2.9rem, 5.6rem)` with 0.98 line height, h2 `clamp(2.3rem, 4.1rem)` |
| Emphasis | Italic serif in terracotta inside headlines | `<em>` in headlines becomes italic, colour `#B85C38` / `#A14E2E` |
| Micro labels | Monospace uppercase ("ABOVE RANGE") | DM Mono uppercase eyebrows, "LAB'S RANGE" labels |
| Background | Warm paper rgb(254,249,239), cream panels rgb(245,238,225) | `#FAF6EE` paper, `#F3EDE2` panels, `#FFFDF8` cards |
| Shadows | Almost none; thin borders | Shadows removed; 1px `#E6DDCE` lines |
| Buttons | Terracotta pill primary, outlined secondary | `.fh-btn-primary` (`#A14E2E`, white text), `.fh-btn-outline` |
| Comparison | Raised terracotta column for the product | Solid terracotta column, white check circles, outlined crosses |
| FAQ | Narrow centred column, cream panels, square plus buttons | Same pattern, rewritten with our own nine questions |
| Footer | Raised warm-white rounded card, 3 columns, right-hand area, small legal links, fine print below | Same structure with our own links. No social, newsletter or app-store links, because none exist |

## 2. Design system (`site.css`)

- **Tokens**: `--fh-paper #FAF6EE`, `--fh-cream #F3EDE2`, `--fh-white #FFFDF8`, `--fh-ink #292929`, `--fh-terracotta #B85C38`, `--fh-accent #A14E2E`, `--fh-teal #0F766E`, and a line colour `#E6DDCE`.
  - The app's older `--ft-*` tokens are remapped to these, so app screens pick up the palette.
- **Type**: Newsreader for titles (300/400 plus italic 300), DM Sans for body text, DM Mono for labels.
  - Fonts were trimmed from 429 KB to 223 KB: Domine and unused weights were dropped.
- **Spacing**: one section rhythm, `--fh-section: clamp(64px, 8vw, 120px)`.
- **Motion**: CSS only. No animation library was added.
  - Every transition and keyframe is switched off under `prefers-reduced-motion`.
- **Specificity**: the legacy `.app-shell` font rules use `!important`. The new rules beat them with scoped selectors, so the legacy files did not need rewriting.
- **Removed CSS**: about 517 obsolete landing selectors (`.lp-*`, the old story, guide, FAQ, comparison and footer rules) were removed from `ui.css` and `styles.css`.
  - The help widget's `lp-chat*` rules were kept.

## 3. Sections rebuilt (homepage)

| # | Section | Implemented | Visually verified |
|---|---|---|---|
| 1 | Header: logo, How it works, Explore reports, AI Health Guide, For doctors, Sign in, call to action | Yes. The links show at 1081px and wider; tablets and phones keep the app tab bar | 1440, 1024, 768, 390, 320 |
| 2 | Hero: "Your health reports, *finally explained.*", two buttons, sample report preview with units and the lab's ranges | Yes | All 5 widths |
| 3 | Animated report explanation (report → result → plain words → doctor question → over time) | Rebuilt visually. It uses the same `story.js` and the same app wording | 1440, 390 |
| 4 | AI Health Guide (abstract companion, states tied to the real chat, "not a licensed physician") | Restyled. The states only come from the real chat | 1440, 390 |
| 5 | Health information: 5 report areas. Every test listed is checked against the glossary | New | 1440, 390 |
| 6 | How it works, 3 steps | New | 1440, 390 |
| 7 | Comparison (7 rows) | Rebuilt | 1440, 390 |
| 8 | DocBridge (for doctors) | Rebuilt | 1440 |
| 9 | Trust and privacy (does / never / your data). No HIPAA, certification or zero-retention claims; an eval checks this | Rebuilt | 1440, 390 |
| 10 | Pricing (prices unchanged) | Restyled | 1440 |
| 11 | FAQ (9 questions, one open at a time, keyboard accessible) | Rebuilt | 1440, 390 |
| 12 | Final call to action | Rebuilt | 1440, 390 |
| 13 | Footer card | Rebuilt | 1440, 390 |

The brief's order is kept. Pricing sits between Trust and FAQ, as it did before.

## 4. Before and after

All screenshots are of synthetic sample data. "Before" is the branch just before this rebuild; "after" is the current branch.

| | Before | After |
|---|---|---|
| Hero 1440 | ![](function-redesign/before-hero-1440.png) | ![](function-redesign/after-hero-1440.png) |
| Hero 1024 | ![](function-redesign/before-hero-1024.png) | ![](function-redesign/after-hero-1024.png) |
| Hero 768 | ![](function-redesign/before-hero-768.png) | ![](function-redesign/after-hero-768.png) |
| Hero 390 | ![](function-redesign/before-hero-390.png) | ![](function-redesign/after-hero-390.png) |
| Hero 320 | ![](function-redesign/before-hero-320.png) | ![](function-redesign/after-hero-320.png) |
| Demo 1440 | ![](function-redesign/before-demo-1440.png) | ![](function-redesign/after-demo-1440.png) |
| Demo 390 | ![](function-redesign/before-demo-390.png) | ![](function-redesign/after-demo-390.png) |
| AI Guide 1440 | ![](function-redesign/before-guide-1440.png) | ![](function-redesign/after-guide-1440.png) |
| AI Guide 390 | ![](function-redesign/before-guide-390.png) | ![](function-redesign/after-guide-390.png) |
| Comparison 1440 | ![](function-redesign/before-compare-1440.png) | ![](function-redesign/after-compare-1440.png) |
| Comparison 390 | ![](function-redesign/before-compare-390.png) | ![](function-redesign/after-compare-390.png) |
| FAQ 1440 | ![](function-redesign/before-faq-1440.png) | ![](function-redesign/after-faq-1440.png) |
| FAQ 390 | ![](function-redesign/before-faq-390.png) | ![](function-redesign/after-faq-390.png) |
| Footer 1440 | ![](function-redesign/before-footer-1440.png) | ![](function-redesign/after-footer-1440.png) |
| Footer 390 | ![](function-redesign/before-footer-390.png) | ![](function-redesign/after-footer-390.png) |

All screenshots are Chromium (Playwright) renders, not physical devices.

## 5. Issues found while rendering, and fixed

Each pass: render → critique → fix the top weaknesses → re-render.

1. **Headings showed in the old dark-green bold serif.** A legacy `.app-shell h1, h2` rule with `!important` overrode the new styles. Fixed at the source.
2. **The phone tab bar jumped to the top of the screen.** The header's blur effect made the header the reference box for the fixed tab bar. The blur now only applies above 720px. An existing upload eval caught this.
3. **The animated demo did not start on phones.** The trigger needed 35% of a very tall section on screen. It now watches the demo stage itself.
4. **Closed FAQ answers were still read by screen readers.** They are now hidden while closed.
5. **The comparison logo rendered as a white square, and the column had stripes.** The logo was removed from that header and the column made solid.
6. **Footer accent text failed contrast on phones.** It now uses the darker terracotta.
7. **At 768px the header wrapped onto two rows.** On tablets the duplicate "Sign in" link is hidden (the tab bar already has Account), so the header is one row.
8. **Demo cards not yet played showed faint, unreadable text** (axe contrast 1.7:1). They now show an empty outline until their step plays.
9. **Wide gaps between sections and some headings off-centre.** Fixed with one section rhythm and centred section heads.

## 6. Clinical safety checks

- **Values and units**: shown exactly as in the analysis. `design-quality.mjs` compares each card's displayed value text to `buildReportView` output, at 1440, 390 and 320. Listen still reads the value with its unit.
- **Demo wording**: the demo's explanation is the app's own text for the same numbers (`homepage.mjs`).
- **Clinical rules**: no clinical thresholds, urgency rules or medical wording were changed. `safety-cases` and the other clinical evals pass unchanged.
- **No invented signals**: no scores, gauges or urgency badges were added. Status chips use the app's existing words, such as "Far above the lab's range".

## 7. Tests

These were run locally against the branch on 10 Nov 2026.

| Check | Result |
|---|---|
| All 34 eval/check commands in `frontend-ci.yml` | Pass. CSP check passes with and without response headers. |
| Homepage eval (section order, labels, header links, glossary match, trust claims, footer, tour, axe on all sections) | Pass, desktop and phone |
| Landing premium eval with axe (demo, FAQ, comparison) | Pass after fix 8 |
| Design quality eval: no sideways scroll at 1440/1024/768/390/320, exact values, header at 320 | Pass |
| Accessibility scan (axe, 21 screens × 2 sizes) | 0 serious/critical in 7 of 8 runs. One run reported 1 serious issue that did not reproduce in 7 repeats; it was not identified. See Pending. |
| Smoke test, cache-version check, claims audit, CSP meta | Pass |

## 8. Performance

Measured on the homepage at 390px with 4× CPU slowdown, median of 3 runs.

| | LCP | CLS | CSS | Fonts | JS |
|---|---|---|---|---|---|
| main (before) | 1064 ms | 0 | 250 KB | 155 KB | 842 KB |
| branch (after) | 968 ms | 0 | 243 KB | 223 KB | 850 KB |

Fonts are larger because the design uses a light display serif plus a mono face. Even so, LCP is lower and nothing shifts while loading.

Homepage height grew at 1440 (9,903 → 10,751px) because the health-information and how-it-works sections were added. It shrank on phones (320px: 18,144 → 17,049px).

## 9. App screens, pass 3: Results (10 Nov 2026)

Styling only, in `site.css`, scoped to `#report-results`. No value, word, order or rule changed. The design-quality eval still checks that every card shows the analysis's exact value text and that Listen reads the unit.

What changed, from the audit of the rendered screen:

1. **Typography.** Headings were bold sans; they are now the light serif used on the homepage. Values were heavy sans; they are now large light serif with a smaller sans unit, and the lab's range is in mono.
2. **Cards.** The thick orange left stripes and shadows are gone, replaced by thin warm lines. Status chips keep their exact words, on a soft terracotta background.
3. **Palette.** The mint "Questions for your doctor" panel and the blue-grey safety note now use cream panels. App primary buttons everywhere are terracotta pills, so Results no longer mixes teal and terracotta buttons. Links in Results and the active tab use the accent colour. Primary buttons wrap cleanly on phones.

| | Before | After |
|---|---|---|
| Results 1440 (top) | ![](function-redesign/results-before-1440-0.png) | ![](function-redesign/results-after-1440-0.png) |
| Results 1440 (questions, steps, save) | ![](function-redesign/results-before-1440-1.png) | ![](function-redesign/results-after-1440-1.png) |
| Results 390 (top) | ![](function-redesign/results-before-390-0.png) | ![](function-redesign/results-after-390-0.png) |
| Results 390 (questions) | | ![](function-redesign/results-after-390-1.png) |

On the 390px shots, the tab bar in the middle of the image is a full-page capture effect: it is fixed to the bottom of the screen.

Tests after this pass: all 34 CI commands pass (cache version 219), CSP passes with and without headers, and the smoke test passes.

## 10. App screens, pass 4: Upload (10 Nov 2026)

Styling only: the same controls, words and order.

- The mint drop area is now a warm white panel with a fine dashed line. It turns soft terracotta on hover or drag. Its title is in the serif, and its camera icon sits on terracotta.
- The selected "Whose report?" chip was teal; it is now ink. Other chips are white with thin lines.
- The eyebrow is mono terracotta, and "What happens to my data?" uses the accent colour.

| Upload 1440 | Upload 390 |
|---|---|
| ![](function-redesign/upload-after-1440.png) | ![](function-redesign/upload-after-390.png) |

No "before" shot of this screen was kept in the repository. In the render taken just before this pass, the drop area was mint with a teal camera tile, and the selected chip was teal.

Tests: all 34 CI commands, CSP with and without headers, the smoke test and the accessibility scan (0 serious or critical) pass.

## 11. App screens, pass 5: Original-report evidence and doctor brief (10 Nov 2026)

These changes are styling only. The values, statuses, wording, rules version and the safety banner are unchanged.

- **All tests on your report**:
  - The teal header row is now cream with ink text. It was first lighter, and axe flagged it at 4.41:1, so it was darkened to pass.
  - Test names are ink instead of teal, and the result and range columns are in mono so the numbers line up.
  - The active filter chip is ink instead of teal. "In range" keeps its teal; the other statuses keep terracotta.
- **The line in your report**: the label is in the accent colour. The quoted line is unchanged.
- **Doctor brief** (the page that prints or saves as PDF):
  - Headings use the serif instead of teal sans, with a thin terracotta rule under the title.
  - The table has a cream header and hairline rows, and the button is a terracotta pill.
  - The "verify against the original report" banner stays at the top, in soft terracotta.
  - It loads no web fonts, so printing doesn't depend on the network.

| | Before | After |
|---|---|---|
| Doctor brief | ![](function-redesign/brief-before.png) | ![](function-redesign/brief-after.png) |
| All tests 1440 | ![](function-redesign/evidence-before-1440.png) | ![](function-redesign/evidence-after-1440.png) |
| All tests 390 | | ![](function-redesign/evidence-after-390.png) |
| The line in your report | | ![](function-redesign/evidence-line-after-1440.png) |

In the evidence shots, the header sitting across the table is the sticky header captured during scrolling.

Tests after this pass (cache version 220):
- All CI eval commands pass, including results-groups with axe, CSP with and without headers, and the smoke test.
- The accessibility scan finds 0 serious or critical issues.

## 12. App screens, pass 6: History and trends, Record, Reminders (10 Nov 2026)

These changes are styling only. Trend values, dates and ranges are unchanged, and the history-trends eval (32 checks) still passes.

- **Section labels** ("Report history", "Reminders" and others) are now mono terracotta across the app, instead of teal sans.
- **History**:
  - Report titles are in the serif instead of bold teal, and "Open this report" uses the accent colour.
  - "Results over time" is a serif heading, and the trend cards use thin lines.
- **Record**: the summary card titles are in the serif instead of teal.
- **Reminders**:
  - "Add a reminder" is a compact pill; before, it stretched across the full width.
  - The yellow sign-in note is now a cream panel.

| | Before | After |
|---|---|---|
| History 1440 | ![](function-redesign/hist-before-1440.png) | ![](function-redesign/hist-after-1440.png) |
| Record and reminders 1440 | ![](function-redesign/rem-before-1440.png) | ![](function-redesign/rem-after-1440.png) |
| Record and reminders 390 | | ![](function-redesign/rem-after-390.png) |

In these shots, the header partly covering the Record title is the sticky header captured when the page jumps to Reminders.

Tests after this pass (cache version 221): all 34 CI commands pass, including the accessibility scan with axe, and so do CSP with and without headers and the smoke test.

## 13. App screens, pass 7: DocBridge, plus Sign-in and the AI guide (10 Nov 2026)

These changes are styling only. Prices, wording and the evaluation-mode notice are unchanged.

- **DocBridge**:
  - The yellow evaluation-mode notice is now a cream panel; its text is unchanged.
  - The pricing cards have serif titles and thin lines.
  - The teal-outlined "Try it in 60 seconds" box is a cream panel.
  - "Try the doctor demo", "Go to sign in" and "Join the waitlist" are compact pills instead of full-width bars.
- **Sign-in and Account (signed out)**: already in the new palette from the shared button and token changes. It was checked by screenshot at 390 in the Results pass, and nothing further was changed.
  - **Not checked**: the signed-in Account view. It needs a live backend session, and this pass did not mock one.
- **AI Health Guide**: the homepage guide was restyled in the rebuild (section 3). The help chat ("Need help?") already uses the ink and cream palette and was left as it is.

| | Before | After |
|---|---|---|
| DocBridge 1440 | ![](function-redesign/docbridge-before-1440.png) | ![](function-redesign/docbridge-after-1440.png) |
| DocBridge 390 | | ![](function-redesign/docbridge-after-390.png) |

Tests after this pass (cache version 222): all 34 CI commands pass (including the accessibility scan with axe), CSP passes with and without headers, and the smoke test passes.

## 14. App screens, pass 8: Account, signed in (10 Nov 2026)

Rendered with a mocked session: synthetic email `sample.user@example.com` and a mocked `/auth/me`, the same approach as `scripts/eval/staff-two-factor.mjs`. No real account was used.

These changes are styling only. Plans, prices and wording are unchanged.

- The avatar circle was mint; it is now cream with a serif initial.
- The "Verified" badge was a mint pill; it is now white with a thin line. The text keeps its teal, as a positive state.
- The current-plan card had a teal border and mint fill; it is now cream with an ink border. Other plan cards use thin lines.
- The "How deletion works" link was browser-default blue; it now uses the accent colour.

| | Before | After |
|---|---|---|
| Account 1440 | ![](function-redesign/account-before-1440.png) | ![](function-redesign/account-after-1440.png) |
| Account 390 | | ![](function-redesign/account-after-390.png) |

In these shots, "We couldn't check your account right now" appears because the mock answers only `/auth/me`. That is expected, not a bug.

Tests after this pass (cache version 223): all 34 CI commands pass (including the accessibility scan with axe), CSP passes with and without headers, and the smoke test passes.

## 15. Pending

- **App screens**: Results is done (section 9). Upload (section 10) and original-report evidence plus doctor brief (section 11) are done. History, Record and Reminders (section 12) are done too. DocBridge, Sign-in and the AI guide are covered in section 13. The signed-in Account view is covered in section 14.
  - Other secondary tools (meal planner, symptom timeline, care calendar and similar) also pick up the shared styles, but have not been checked screen by screen.
- **Screenshots**: before/after shots of the homepage DocBridge, pricing and trust sections at 1024/768 have not been captured for this document.
- **Reference screenshots**: the three the brief mentions never arrived. If they are re-sent, the comparison, FAQ and footer will be checked against them.
- **Accessibility scan**: investigate the one unreproduced axe failure if it shows up in the nightly scan.
- **Header at 320px**: the button shows only "Understand". The full label is kept as its accessible name.
- **Not done here**: real-device testing, deploying and merging. Those are the owner's.
