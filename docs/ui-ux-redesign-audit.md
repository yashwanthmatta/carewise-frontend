# UI/UX redesign: baseline audit

Date: 2026-10-26. Scope: the website (followthroughhealth.com: home, upload, result, history, account) and the
phone app's sign-in. Method: the screens rendered locally at desktop (1280×900) and phone (390×844) sizes,
read alongside the code, plus an automated accessibility scan (axe-core, WCAG 2.2 AA rules).

## What we know from users

The founder spoke with early users. Most liked what the product does, but two pieces of feedback came up
again and again:

1. **"The UI/UX is not good."**
2. **"The sign-in page is not good."**

That is the only direct user evidence available. Nothing below is a quote, a measurement of user
behaviour, or a satisfaction score. Each issue is marked **Observed** (seen in the rendered screens or the
code) or **Hypothesis** (a likely reason for the feedback, still to be confirmed in the usability test in
`docs/mobile-ux-testing.md`).

## The five most frustrating issues (before)

| # | Issue | Evidence | Fixed in this round |
|---|---|---|---|
| 1 | **Sign-in was confusing.** "Create account" and "Login" sat side by side as equal buttons over one shared form, so people had to work out which one applied to them. There was no show-password option. "Forgot password" was hidden in a fold labelled "Log out, verify email, reset password or delete account". A red "Not signed in" badge read like an error. The plans, two-step sign-in and doctor-links panels stacked underneath, even when signed out. | Observed (`compare-*-account.png`) | Yes: separate Sign in / Create account tabs, one button, show password, "Forgot password?" next to the field, a calm sign-in card, and account-only panels hidden until signed in. |
| 2 | **Sign-in looked frozen.** The server can take up to a minute to wake after a quiet period. Pressing Login gave no sign that anything was happening. | Hypothesis, based on how the server behaves; the code had no busy state | Yes: the button shows it is working, and after 5 seconds the card explains the wait. Repeat taps are ignored, so the request is never sent twice. |
| 3 | **Two navigation bars.** On desktop, a marketing bar (How it works, Safety, Pricing…) sat above a second app bar (Home, Upload, History…). | Observed (`compare-desk-home.png`) | Yes: one header with the app tabs, plus Sign in / Account and "Explain a report". The marketing links moved to a row under the hero. |
| 4 | **The answer was buried on phones.** On the result screen, 6 action buttons and a language menu wrapped into 4 rows above the summary. The summary sat inside three nested boxes. | Observed (`compare-phone-result.png`) | Yes: three main actions (Doctor brief, PDF, Share) plus "More". The phone result uses a single container. |
| 5 | **The homepage was shouty and unclear about what to do.** The display headline was about 96px. A dashed drop zone was the only clear action. The sample report took two steps to see. | Observed (`compare-desk-home.png`) | Yes: a calmer headline, two clear actions ("Understand a report" and "Try a sample report", which explains it in one tap), a trust row, and an education-only line. |

## Other findings

| Finding | Evidence | Status |
|---|---|---|
| The History list showed internal codes such as "Follow-up: needs_review" | Observed | Fixed: shows the date instead. No new urgency wording was added. |
| Sign-in messages used jargon ("Local prototype data…", "Try Log in" when the tab says Sign in) | Observed | Fixed: plain-language messages. |
| Help chat, FAQ, Support and the data-deletion page described the old account menu | Observed (the help-answers test caught one) | Fixed: steps now name the new Account screen. |
| Three design layers in `styles.css` (about 6,900 lines), each overriding the last | Observed | Partly addressed: one token layer (`ui.css`) now governs the colours, type, buttons, inputs and the redesigned screens. Removing the old layers is a separate clean-up. |
| The homepage is about 12,000px tall on a phone | Observed | Not changed in this round. Shortening it means dropping marketing sections, which is a product decision for the founder. |
| No dark mode | Observed | Deferred. The legacy CSS hard-codes light colours in hundreds of rules, so a safe dark mode needs the old layers removed first. |
| Help button overlaps content at the bottom right on phones | Observed | Not changed (existing component). |

## Accessibility

- **Before:** no automated scan in CI.
- **After:** axe-core with the WCAG 2.0/2.1/2.2 A and AA rules found **no violations** on home, sign in, create account and the sample result, at both 1280px and 390px. This is automated checking only. It is not a full accessibility audit. VoiceOver, TalkBack, 200% zoom and keyboard-only passes still need a person (see `docs/mobile-ux-testing.md`).
- **Contrast:** body text on the background is 8.6:1, secondary text on white is 5.7:1, and white on the brand teal is 5.5:1.
- **Touch targets:** every new control is at least 44px tall.
- **Motion:** turned off under `prefers-reduced-motion`.

## Design directions considered (UI/UX Pro Max)

The skill's design-system search (`"healthcare patient lab results calm trustworthy"`, with variance 3, motion 3 and density 4) returned three candidate directions:

| Direction | What it was | Decision |
|---|---|---|
| A. Clinical Swiss | Sky blue `#0284C7`, Figtree / Noto Sans, minimal | **Rejected.** It reads as a generic patient portal and would throw away FollowThrough's recognisable warm-paper and teal identity. Its black-on-sky contrast pairs also failed our checks for white button text. |
| B. Accessibility first | Atkinson Hyperlegible throughout, high contrast | **Partly adopted.** We kept its rules: 17px body text, 4.5:1 minimum contrast, labels above fields, and no information carried by colour alone. We did not adopt the typeface, because it would add a font download and change the brand voice. |
| C. Warm, calm, human (selected) | An evolution of the current brand: warm paper background, ink text, one teal, amber for "outside the lab's range" paired with words, DM Sans for text, Inter Tight for headings, soft depth, short motion | **Selected.** It best fits a caregiver audience, keeps the identity, and uses fonts the site already loads, so it adds no page weight. |

Its UX rules also shaped the sign-in card:
- Password visibility toggle.
- Visible submit feedback.
- Labels on every input, never a placeholder alone.

## Round 4 (2 Nov 2026): screen-by-screen issue register

**Sources:**
- The owner's report that people like the product but find it hard to use. The specific complaints recorded are the results screen, uploading, the mobile navigation, and too much on screen.
- Measured browser behaviour on this branch versus `main`, with the sample "Raj" report on a 390 × 844 phone viewport.

No usability sessions have been run yet. Rows marked **Observed** were seen and measured in the browser; rows marked **Hypothesis** need a person to confirm.

| Screen | Issue | Evidence | Kind | Severity | Status |
|---|---|---|---|---|---|
| Results | Four doctor actions (Doctor brief, PDF, Share, More) sat **above** the results, before the person had read anything | Screenshot `compare4-phone-result-top.png` | Observed | High | Fixed: moved to "Questions for your doctor" and "Save or share", after the results |
| Results | The questions for the doctor were folded away at the bottom | `compare4-phone-result-questions.png` | Observed | High | Fixed: "Questions for your doctor" is open, with one main action |
| Results | "Doctor brief" does not say what it does | Label text | Hypothesis | Medium | Renamed "Prepare questions for your doctor", with a one-line description |
| Results | Each card repeated a "What does this mean?" heading | Screenshot | Observed | Low | Heading kept for screen readers only; the meaning shows directly |
| Results | The line from the report sat inside a toggle labelled "More about this result", so finding the source meant guessing | Card markup | Observed | Medium | Toggle renamed "More, and the line in your report". For PDFs, "See it on the report page" opens the page with the row marked |
| Results | Nothing on the results said that a number read from a photo still needed checking; the check box was back in the upload area | `ocr-resolution.mjs` flow | Observed | High (safety) | "Please check these numbers" now sits above the results, with a button that moves focus to the check |
| Results | Copy summary and Share summary did the same job | Markup | Observed | Low | Now one button: Share where the device can share, Copy elsewhere |
| Results | 26 tappable controls on the phone result | Count from the browser | Observed | Medium | 23 (the remaining ones are per-card "More" toggles) |
| Results | The phone page grew from 4,795 px to 5,119 px | Measured | Observed | — | Because the questions (6) and save actions are now visible rather than folded. The cards themselves are shorter. |
| Upload | One upload box, one sample card, typing as a fallback | Round 3 | Observed | — | Done in round 3 |
| Navigation | Five tabs on the phone bar (Home, Upload, History, Record, Account) | Screenshot | Hypothesis | Medium | Next stage: check every tab leads to a working feature before changing the labels |

## Journey map (target)

| Step | Where am I? | What can I do here? | What happens next? |
|---|---|---|---|
| Open | Home: "Your health reports, explained clearly" | Understand a report / Try a sample report | The upload screen or the sample result |
| Upload or sample | "Upload": whose report, one upload box, sample card | Choose a file, take a photo, try the sample, or type | The reading card shows the file name; Cancel is available |
| Understand | "Your report is ready" + "Your report in plain words" | Read the summary, change language, Listen | Scroll to the results |
| Explore | "Your results to look at" | Open "More, and the line in your report"; see the PDF page | — |
| Check (photos only) | "Please check these numbers" | Confirm or fix the doubtful numbers | Sharing and saving unlock |
| Prepare | "Questions for your doctor" | Prepare questions for your doctor (one page), Copy questions | Print or save as PDF |
| Save or finish | "Save or share" | PDF for your doctor, Send a link, Save to my lab tracker, Share or Copy, Calendar | Done; History keeps saved reports |
