# Agent task completion tracker

One section per agent task. Status is one of: COMPLETE, PARTIALLY COMPLETE, BLOCKED, NOT STARTED.

This file is served publicly with the website. Keep it to status only: no outreach drafts, no
contact names, no patient data, no secrets. Drafts live in private Claude artifacts.

---

## Doctor outreach: DocBridge pilot recruitment kit

**Status:** COMPLETE (the kit is built and checked). Sending anything is the founder's job.

**Assigned task:** Build a pilot recruitment kit the founder can use, published as one private
Claude artifact, with wording that matches what DocBridge really does.

**Requirements and result**

| # | Requirement | Result |
|---|---|---|
| 1 | Who to target first (practice types, roles, why) and legitimate places to find them, with no scraping | Done |
| 2 | First email under 120 words, three versions (physician, practice manager, personal contact), each with a small ask | Done (117, 112 and 112 words) |
| 3 | Follow-up emails for day 4 and day 10, short and easy to say no to | Done |
| 4 | Phone script: front-desk opener, who to ask for, 20-second pitch, voicemail | Done |
| 5 | Five-question interview guide for a 15-minute call, not a sales pitch | Done |
| 6 | Tracking sheet layout for logging contacts by hand | Done (21 columns, status list, copyable header row) |
| 7 | Publish as one private artifact | Done: https://claude.ai/artifact/Y1vRjDbsvM8iGxtEBuJpkq (private, owner only) |

**Source of truth checked:** the DocBridge section of `index.html` and
`docs/pilot-clinic-onboarding.md` on `main`. Where they differ, the kit follows the stricter
onboarding rules: made-up sample labs only, approved links go to clinic staff only during the
pilot, patient follow-up questions are off. The kit points doctors to the no-sign-in demo at
`followthroughhealth.com/#doctor-demo` (handled in `docbridge.js`).

**Tests run (headless Chromium, on the published page file)**

- No sideways scrolling at 390px and 1280px, in light and dark themes: pass.
- No script errors, and the right background in each theme: pass.
- Email word counts under 120 (first emails) and under 80 (follow-ups): pass.
- Tracking sheet: 21 columns in the table and in the copyable header row: pass.
- Copy buttons copy, or select the text when the clipboard is blocked: pass.
- Scripts say "made-up sample labs only", make no "HIPAA compliant", "clinically validated" or
  "proven" claims, and link to the demo: pass.

**Changed files in this repo:** `docs/agent-task-completion.md` (this file only). No served page
changed.

**Not done on purpose (hard rules):** no emails, calls or LinkedIn messages sent; no contact lists
built; no personal emails looked up.

**Open items for the founder (decisions, not blockers)**

- Trial length: the emails ask for a two-week trial with sample labs. The website offers a free
  30-day pilot. The shorter ask fits inside it. Change it if you want them to match.
- Add your business postal address to the email signature before sending cold emails (US
  CAN-SPAM rule).
- Website wording: the DocBridge section still says "de-identified or sample labs", while the
  onboarding guide says synthetic sample labs only. A product or website owner should decide
  whether to tighten the site copy. The outreach kit already uses the stricter wording.
