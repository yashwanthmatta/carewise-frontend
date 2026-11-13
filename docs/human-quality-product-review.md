# Human-quality product review

This is the running tracker for the "human-centered product transformation" brief (13 Nov 2026).

**Scope.** It covers the website and app at followthroughhealth.com, the mobile app, and the API.

**How findings are recorded:**
- Every finding comes from looking at the rendered product, the code, or production logs.
- Nothing here is user research. No usability sessions have been run yet, and no real user feedback has been collected or quoted.
- "VERIFIED" means the change was checked in rendered screenshots and by the automated checks. It does **not** mean a person has reviewed it.

**Statuses:**

| Status | Meaning |
|---|---|
| DISCOVERED | Seen once, not yet confirmed |
| CONFIRMED | Reproduced and measured |
| IN PROGRESS | Being fixed |
| IMPLEMENTED | Fix is in code |
| VERIFIED | Fix confirmed in screenshots and checks |
| REQUIRES HUMAN REVIEW | Needs a qualified person to decide or approve |
| BLOCKED | Waiting on the owner or an outside service |

## How the audit was done (13 Nov 2026)

**What was rendered.** I served the current `main` (3994f43) locally and captured screenshots with Playwright:
- 12 pages at 1440 and 390 px: home, upload, history, record, account, DocBridge, your data, safety, about, FAQ, support and demo.
- Home, upload and account also at 1024, 768 and 320 px.
- No page scrolled sideways at any width.

**What was measured.**
- Overlap between the help button and page controls, read from element bounds.
- What the "Watch it work" section shows 0.4 s and 4 s after it scrolls into view.

**What this audit cannot see.**
- The live site and API, which this environment cannot reach (proxy 403).
- Real phones.
- Real users.

## The ten most important verified problems

Ranked by how much each one makes the product feel unfinished or generic, or confuses someone using it.

| # | Problem | Evidence | Status |
|---|---|---|---|
| 1 | **Every section heading used the same formula**: plain words plus an italic terracotta phrase ("…*finally explained*", "…*to a clear next step*", "*Not just* a page of numbers", "Frequently asked *questions*"). 10 of 11 headings repeated it, and repetition like this reads as a template. | `index.html` had 11 `<em>` accents; screenshot `before-home-1440-part4.png` | VERIFIED: the hero keeps its accent; the other headings are plain sentences |
| 2 | **"Watch it work" showed empty boxes.** Four bordered cards stayed blank until their step played, about 4–30 s in. They looked like broken loading placeholders. | `before-story-4s.png`: three empty boxes after 4 s | VERIFIED: cards appear only when their step plays; no empty shells |
| 3 | **The help button covered controls.** The 162 px "Need help?" pill overlapped the Upload screen's main **Explain report** button at 1440 × 900. The two boxes intersected at x 1258–1285, y 828–860. | Element bounds; `before-report-1440.png` | VERIFIED: a 52 px round button at x 1368, clear of the button (ends x 1285); the name for screen readers is unchanged |
| 4 | **Two competing accent colours.** Buttons were terracotta, but links ("Forgot password?", "Show"), focus rings, icons, the help button, progress bars and chat bubbles were teal. | `before-account-1440.png` | VERIFIED: one action colour, set through the tokens in `site.css`; teal stays only in the logo and "within range" status |
| 5 | **The AI Health Guide's glossy teal sphere** (three radial gradients and a sparkle) is the stock "AI orb" look. | `before-home-1440-part2.png` | VERIFIED: a flat ink disc with the same abstract mark, a hairline ring and one terracotta dot. Still labelled as AI, not a person. Animation states unchanged |
| 6 | **Pricing note sent users to a screen that does not exist**: "Cancel any time from Profile". The site has no Profile screen; it is Account. | `index.html:305` | VERIFIED: now says Account. Prices and billing wording are otherwise unchanged |
| 7 | **"Who else handles your data" looked empty.** It is a collapsed section, but its arrow had been styled away, so it read as a heading over nothing. This is the list of service providers that handle data, the most important privacy disclosure on the page. | `before-account-1440.png` | VERIFIED: a visible chevron that turns when opened |
| 8 | **Small headings on Account and Your data were inconsistent**: heavy sans with tight letter spacing. The same level on Record uses the serif. | `before-account-1440.png` | VERIFIED: serif at the same size everywhere |
| 9 | **The homepage is 10,751 px long** (12 sections), with the same "Understand my report / Try a sample report" pair repeated four times. | Full-page screenshot | IMPLEMENTED (owner approved the mock-up on 13 Nov): rebuilt, now 6,364 px at 1440. See "Homepage rebuild" below |
| 10 | **Duplicate empty-state text.** Upload showed "Add a photo or PDF…" and also "No report analysis yet." History shows "Add values from your reports…" and also "No lab values saved yet…". | `before-report-1440.png`, `saved-1440.png` | Upload: VERIFIED (the second line is removed). History: CONFIRMED, next pass |

**Also seen, not yet fixed:**
- Record says "or try the sample 20-year history", but that button is hidden inside the closed "Add to the record" section. CONFIRMED.
- The DocBridge demo video's first frame starts part-way through a scroll, so "Use a sample lab" is cut off at the top. CONFIRMED.

## Security and privacy findings carried in from production checks

None of these is a change to production. Each needs the owner.

| Finding | Evidence | Status |
|---|---|---|
| The help chat's AI key is rejected by Anthropic, so every `/assistant/chat` request since 11 Nov has failed (502 `AuthenticationError`). Users get only the small built-in answers. | Render logs, carewise-api | BLOCKED: the owner must create a new key and replace it in Render |
| The Render Postgres database accepts connections from any IP address (0.0.0.0/0). The password still protects it, but the network is open. | Render database settings (read-only) | REQUIRES HUMAN REVIEW: the owner should restrict it to Render's private network. This needs a check that nothing outside Render connects first |
| **"Health details saved to your account are stored encrypted"** (Your data card) overstated what is encrypted. The backend encrypts 18 listed health columns plus the `encrypted_*` fields. Dates, risk level and reminder times, days and time zone are stored plain on purpose (backend `docs/security-hardening/inventory.md`; `medicine_reminders.times` is `String(64)`). | Backend code at the live deploy b9b5f3c (Render, 13 Nov); inventory.md | VERIFIED (website): the card now says lab results and report details are encrypted before they are stored, and that dates and reminder times are not. New claims-audit rule `blanket-encryption` fails on the old sentence and passes on the new one |
| **Rows saved before 2 Nov 2026 may still be plaintext.** Encryption on write shipped with migration 0023 (merged 2 Nov). The one-time backfill of older rows needs owner approval and a backup, and no record shows it was run. | Backend `docs/security-hardening/implementation-status.md` row 2: "production backfill" listed as remaining | REQUIRES HUMAN REVIEW: the owner runs the count-only report (`PYTHONPATH=. python scripts/security/encrypt_fields.py`, no `--apply`; it prints counts, never values), then takes a backup and runs the backfill if any `plaintext` count is above 0 |
| **The privacy policy says reminder "times … stored encrypted".** They are not (see above). | `legal/privacy.html` line 30 | REQUIRES HUMAN REVIEW: legal-page wording waits for counsel (repo rule in `scripts/claims_audit.mjs`). Proposed text: "If you set medicine reminders: who they are for and the reminder name, stored encrypted; the times, days and time zone, stored without encryption so the reminders can be sent on schedule; and whether each time was marked as taken." |

## Homepage rebuild, 13 Nov (after the owner said it still looked AI-made)

**Why the craft pass wasn't enough.** It fixed details, but the page kept the structure every generated landing page has:
- a mono eyebrow over a centred serif headline;
- three rounded cards with fake mini-interfaces;
- an animated demo;
- a glowing "AI" section;
- a checkmark comparison table with a coloured "us" column;
- three pricing cards;
- a closing CTA band repeating the hero's buttons.

**What was rebuilt.** The owner approved a mock-up (sent as screenshots) before any code changed.
- **Hero.** A real-looking lab report on paper, with handwritten notes beside it. The notes are the app's own words for those numbers. `homepage.mjs` checks this, and also checks that each pen circle sits on its own value: the marks are placed from the table cells, not by hand.
- **Parts.** Each part has a small margin label, with hairline rules between parts. There are no card grids, no comparison table, no animated demo and no closing CTA band.
- **Writing.** Plain sentences ("Let's read them together"). A short "Why this exists" letter stays unsigned until the owner sends their own name and words; nothing personal was invented.
- **Buttons.** One style: ink with a small radius, and terracotta for links. The app's main buttons and the header now match.
- **AI Health Guide.** A small mark beside the chat, labelled "an AI, not a doctor".
- **Pricing.** A typeset table, with the same prices and the same plan buttons.

**Unchanged:**
- the upload input;
- the sample report;
- the tour;
- the guide chat;
- the FAQ (9 questions, keyboard accessible);
- the DocBridge recording;
- the plan buttons;
- the data-use details;
- every claim.

**Length.** 10,751 px down to 6,364 px at 1440 px wide. No sideways scroll at 1440, 1024, 768, 390 or 320 px.

**Tests changed with the design:**
- **`homepage.mjs`:**
  - checks the new section order and that the removed sections are gone;
  - the hero notes must equal the app's label, range and question;
  - each pen circle must sit on its value;
  - the hero must have no animation.
- **`landing-premium.mjs`:**
  - the story and comparison checks were removed along with those sections;
  - it now checks the pricing rows, that the FAQ prices match the table, and the plan buttons.
- **`design-quality.mjs`:** the hero report must show value, unit and range.
- **Smoke test:** the new headline.

**Screenshots:**
- `before-rebuild-home-1440.png`
- `rebuild-home-1440.png`
- `rebuild-home-390.png`

## Changes in this pass

Branch `claude/carewise-api-project-jmxg7f`; cache version 226.
- **`site.css`:**
  - The action-colour tokens (`--ft-brand*`, `--ft-surface-brand`, `--ft-focus`, `--lp-teal`) now point to the terracotta accent.
  - New "Pass 10" block: hide story cards until their step plays; the round help button; the disclosure chevron; serif small headings; 96 px space below app screens so the last control can scroll clear of the help button.
- **`index.html`:**
  - Section headings rewritten without the italic formula.
  - Pricing note: "Profile" becomes "Account".
  - AI Guide mark redrawn flat.
- **`script.js`:** the duplicate "No report analysis yet." line is removed.

## Test results

- 34 frontend checks run locally (the same list as frontend CI), including the axe accessibility scan, CSP and design-quality: **34 of 34 passed** on 13 Nov.
- Screenshots after the change: `docs/human-quality-review/after-*.png`, next to each `before-*.png`.

## Independent review

No independent or human review has happened yet. The review package for this pass is the PR:
- before/after screenshots;
- the list above;
- the checks.

A person should confirm problems 1–8 look fixed at 1440 and 390 px before this is called done.

## Usability testing

**Not run.** The task script is in `docs/usability-test-kit.md`. It needs five real participants, and no results exist.

## "Welcome back" summary rebuilt (13 Nov, owner feedback: "i didnt like this")

**What the owner saw.** People who come back with a saved report saw the old template:
- four equal rounded cards in a large cream panel;
- the file name ("raj-kidney-heart-uk.pdf") as the headline;
- a run-on line ("7 of 10 results outside the lab's range. LDL cholesterol");
- empty boxes for tracking and reminders that weren't set up;
- uppercase labels;
- terracotta pill buttons.

**Now it is set like the homepage:**
- a margin label;
- one plain sentence about the latest report, saying whose it is, the file and date, and the lab-range count;
- **To talk about:** each result outside the lab's range, with the exact value, unit, label and lab range saved with the report (nothing re-calculated);
- the report's own questions for the doctor, beside the results;
- tracking, reminders and earlier reports, each as one ruled line shown only when there is something in it;
- one ink button.

**Evidence:**
- Screenshots: `before-dashboard.webp` (the owner's screenshot), `after-dashboard-1440.png` and `after-dashboard-390.png`.
- No sideways scroll at 390 px. An overflow found during the work (459 px) was fixed.
- `home-dashboard.mjs` now also checks four things:
  - creatinine is listed with value, unit and range;
  - a result within range is not listed;
  - there is no card grid;
  - the earlier checks still pass, including that a reminder's private title is never shown.
