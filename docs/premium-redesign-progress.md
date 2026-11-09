# Premium redesign: progress

From the founder's brief "Complete premium website rebuild with AI doctor animations" (2026-11-09).
Earlier steps of the same redesign are in `docs/function-health-inspired-redesign.md` (#149, #150, #151).

Statuses: **DONE** (built, tested, in a pull request), **PARTLY DONE**, **NOT STARTED**, **BLOCKED**.

## References

- The founder sent one screenshot in this round (the reference footer). The brief mentions three
  (footer, FAQ, comparison); the FAQ and comparison were designed from the brief's own description.
- functionhealth.com cannot be opened from the build sandbox. Nothing was copied: no text, logos,
  illustrations, layouts, prices or counts.

## Design system

| Token | Value | Use | Contrast |
|---|---|---|---|
| Warm ivory (page) | `#FAF6EE` | background | — |
| Soft cream (sections) | `#F3EDE2` | section panels, FAQ cards | — |
| Warm white (cards) | `#FFFDF8` | cards, chat | — |
| Charcoal (text) | `#292929` | headings, body | 13.5:1 on ivory |
| Secondary text | `#4A4540`, `#635C55` | body, captions | 8.8:1 and 6.1:1 on ivory |
| Terracotta | `#B85C38` | large serif italics, icons, chart line | 4.2:1 on ivory: large text and icons only |
| Deep terracotta | `#A14E2E` | small accent text (eyebrows, links) | 5.4:1 on ivory, 4.95:1 on cream |
| Teal (brand, actions) | `#0F766E` | logo, main buttons, focus ring | 5.1:1 on ivory |

Serif display headings (Domine, already loaded) with italic terracotta emphasis; DM Sans body.
No new fonts, libraries or images: the guide and the chart are inline SVG, animations are CSS.

## Screens and sections

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Design tokens | **DONE** | Above. Applied to the homepage, dashboard and footer. The app screens (upload, results, account) still use the earlier tokens with the new page colours; a full pass is not done. |
| 2 | Hero | **DONE** | Founder's headline and subheading, terracotta italic, warm stage with a slow drift, the preview report's rows arrive one by one. No autoplay audio. |
| 3 | AI Health Guide | **DONE** | Original illustrated guide (inline SVG, drawn for FollowThrough; not a real person). States: idle (breathing, blinking, small sway), listening (typing), thinking (eyes up, three dots), answering (mouth moves while the answer appears), reading aloud. Each state is also written in words. Label: "AI Health Guide — Educational information, not medical diagnosis." **Connected to the real chat**: it uses the help chat's pipeline (`/assistant/chat`, Anthropic), with the built-in answers when the server is not reachable. Emergency words are answered on the device and never sent. Fixed answers for "are you a real doctor" and diagnosis questions; medicine and dose questions are refused. "Include my latest report" appears only when a report is open, and is off by default. "Listen" uses the device's own speech voice; **no microphone input** (no approved provider). Each answer says where it came from and links to the glossary and safety page. |
| 4 | Animated report demo | **DONE** | Six steps: the sample report, the highlighted line, the exact number, unit and range, the app's own explanation, the app's own doctor question, and a history chart labelled "example with made-up numbers" (drawn to scale and tested). Plays only while on screen; pause and step buttons; with reduced motion, nothing plays and every step is shown. |
| 5 | FAQ | **DONE** | Nine questions from the brief, centred serif heading, cream cards, terracotta plus/minus, one open at a time, keyboard and screen reader support. Answers describe only what exists (prices from the pricing section, "phone-call reminders are built but not turned on yet", "apps in development"). |
| 6 | Comparison | **DONE** | "FollowThrough Health vs. reading a lab report alone", 7 rows, no prices, counts or claims about other providers. Becomes cards on phones. |
| 7 | Footer | **DONE** (#151) | Company / Explore / For healthcare professionals / Legal and account. No newsletter box (no opt-in service), no social icons or store badges (none exist), "Mobile apps for iPhone and Android are in development". |
| 8 | Dashboard | **DONE** (#151) | Latest report, its own questions, tracked results, upcoming reminders, recent reports. No score. Trend charts and doctor brief on the dashboard: **NOT STARTED**. |
| 9 | Phone app (`carewise-mobile-app`) | **NOT STARTED** | Needs the same tokens in `src/theme.ts` and the guide as a React Native view. |
| 10 | Real 3D rendering | **NOT DONE, by choice** | The guide is a shaded 2D illustration. A real 3D model or Rive/Lottie file needs a licensed asset or an illustrator; that costs money, so it needs your approval. |

## Testing

| Check | Result |
|---|---|
| `scripts/eval/ai-guide.mjs` (new, CI) | label; idle → listening → thinking → speaking → idle; built-in answers; "are you a real doctor"; diagnosis; medicine dose; emergency words shown as urgent and never sent; online answer from `/assistant/chat` (mocked) with its source; report sent only when chosen; phone size; reduced motion; axe |
| `scripts/eval/landing-premium.mjs` (new, CI) | demo starts at step 1, does not play off screen, plays in view, step buttons pause, the app's own words and exact numbers, chart to scale, FAQ by keyboard, one open at a time, 9 questions, comparison has no prices or counts, no sideways scroll, axe, reduced motion |
| `scripts/eval/homepage.mjs` | now also checks the footer (columns, legal links, "apps in development", safety line, tap size) and scans it with axe |
| axe-core 4.10.2 | no violations in the hero, guide, demo, FAQ, comparison, footer, dashboard, at desktop and 375 px |
| All other evals (report reading, safety cases, OCR, sign in, upload, reminders and more), smoke, claims audit, CSP | pass |
| Real iPhone or Android device | **not tested** |

Found and fixed while testing: low-contrast greeting text in the guide; unrevealed demo cards that
were faint but still read by screen readers (now hidden until their step); the footer headline's
terracotta below 24 px (now the deeper shade); footer links under the 24 px target size on desktop;
a phone table that could scroll but not be reached by keyboard.

## Performance (homepage, phone profile: 4× slower CPU, 10 Mbit/s, median of 5 loads)

| | main before | this change |
|---|---|---|
| Largest content shown | 1.07 s | 1.18 s |
| Time the page is busy (long tasks over 50 ms) | 381 ms | 496 ms |
| Layout shift | 0 | 0 |
| index.html + ui.css + new scripts, gzipped | 41.4 KB | 55.3 KB |

The demo and the guide's idle movement run only while on screen or as cheap CSS transforms; all
movement stops with reduced motion.

## Before and after

`docs/premium-redesign/`: `before-*-hero.png` → `after-*-hero.png`, `before-desk-fullpage.jpg` →
`after-desk-fullpage.jpg`, and `after-*-guide.png`, `after-*-story.png`, `after-*-faq.png`,
`after-*-compare.png`.

## Next

1. The phone app: tokens and the guide.
2. Trend charts on the dashboard from saved results (only real saved values, with dates and units).
3. The same warm tokens across the upload, results and account screens.
4. Your decision: commission a licensed 3D or Rive character, or keep the illustrated guide.
