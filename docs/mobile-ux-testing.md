# Mobile UX testing plan

Automated checks cover layout, scripts and the WCAG rules a machine can test. This plan covers what only a
person can check. **Use synthetic data only**: the sample reports, or the made-up PDFs in
`scripts/eval/pdfs/`. Never use a real person's report.

## 1. Short usability test (5 people, about 15 minutes each)

**Who:** people who look after a parent's health, plus at least one person aged 65 or over. Mix iPhone and Android.

**Before you start, say:** "We're testing the app, not you. Please think out loud. There are no wrong answers."

| # | Task (read it aloud) | Success looks like | Note |
|---|---|---|---|
| 1 | "Find out what this website does." | Says it explains health reports in plain words, within about 10 seconds | Time, words used |
| 2 | "Try it with a sample report." | Taps "Try a sample report" and reaches the explained result | Taps, hesitation |
| 3 | "Which results should you ask the doctor about?" | Names the results in "Results to talk about" | — |
| 4 | "Where did the LDL number come from?" | Opens "Show the line from your report" | Found? |
| 5 | "Get something to bring to the doctor." | Opens "Doctor brief" or "PDF for the doctor" | — |
| 6 | "Create an account." (give them a test email) | Uses "Create account" without asking for help | Any confusion with Sign in |
| 7 | "Sign out, then sign back in." | Uses "Log out", then the "Sign in" tab | — |
| 8 | "You forgot your password. What do you do?" | Finds "Forgot password?" | — |
| 9 | "Find a report you saved." | Opens History | — |

**Record for each task:**
- completed / completed with help / not completed
- seconds taken
- the words they used when stuck

**Afterwards, ask:**
- "What was confusing?"
- "What did you like?"
- "Would you trust it with a parent's report? Why or why not?"

Do not report a satisfaction score unless you actually measured one. Write down quotes word for word.

## 2. Device checks (one iPhone, one Android)

| Check | iPhone (Safari + VoiceOver) | Android (Chrome + TalkBack) |
|---|---|---|
| Homepage: both actions reachable and announced ("Understand a report", "Try a sample report") | | |
| Sign in: tabs announced as tabs, selected state read out | | |
| Show password: announced as "Show password", pressed or not pressed | | |
| Password manager offers to save on Create account, and fills on Sign in | | |
| The answer after Sign in (e.g. "Email or password is incorrect.") is read out without moving focus | | |
| The keyboard doesn't cover the Sign in button | | |
| Bottom tab bar stays clear of the home indicator (safe area) | | |
| Text size at maximum (iOS Larger Text / Android font scale 200%): nothing cut off | | |
| Reduce Motion on: no slide or fade animations | | |
| Demo video plays (iPhone Safari MP4) | | |
| Sample result: cards readable, no sideways scrolling | | |
| Doctor brief opens; PDF downloads or opens | | |

## 3. Automated checks that already run in CI

`scripts/eval/sign-in.mjs` runs at 1280px and 390px. It checks:
- tabs
- the Enter key
- show password
- busy state
- wrong password
- short password
- sign up
- the signed-in view
- account shortcuts
- log out
- two-step code
- forgot password
- reset link
- arrow keys
- no sideways scrolling

Other CI checks keep the rest of the site safe: `live-site.mjs` (daily against the live site), `csp-check.mjs`, and the safety and accuracy evals.
