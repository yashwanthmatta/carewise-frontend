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

## 9. Pending

- **App screens**: Results (highest priority), Upload, original-report evidence, Doctor brief, History/Trends, Reminders, Sign-in, Account, AI Guide screen and DocBridge.
  - They already pick up the new palette and type through the token remap.
  - They have not been redesigned or checked screen by screen yet. This is the next pass.
- **Screenshots**: before/after shots of the DocBridge, pricing and trust sections at 1024/768 have not been captured for this document.
- **Reference screenshots**: the three the brief mentions never arrived. If they are re-sent, the comparison, FAQ and footer will be checked against them.
- **Accessibility scan**: investigate the one unreproduced axe failure if it shows up in the nightly scan.
- **Header at 320px**: the button shows only "Understand". The full label is kept as its accessible name.
- **Not done here**: real-device testing, deploying and merging. Those are the owner's.
