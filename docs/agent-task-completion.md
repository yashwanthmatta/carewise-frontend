# Agent task completion tracker

Status words: COMPLETE, PARTIALLY COMPLETE, BLOCKED, NOT STARTED.
This repository's files are published with the website, so this file holds status only.
Ad drafts, scripts and footage live in the founder's private Claude doc, not here.

## Ads agent

**Assigned task:** A small-budget test ad plan (channels, budget options, 8 Google Search ads,
5 Meta ads, keywords, free measurement with UTM links, launch checklist). Later: review the
founder's 8 video ad concepts and produce what can be produced for them.
Rules: drafts only; no ad accounts, no launches, no spending, no posting, no contacting anyone.

**Final status: PARTIALLY COMPLETE**

| Requirement | Status | Evidence |
| --- | --- | --- |
| Channels and budget options ($5 / $10 / $20 a day, founder chooses) | COMPLETE | Private doc "Small-Budget Test Ad Plan" |
| 8 Google Search ads within 30 / 90 character limits | COMPLETE | Every line length-checked by script (all pass) |
| 5 Meta ads (text, headline, image idea) | COMPLETE | Private doc |
| Keywords and negative keywords | COMPLETE | Private doc |
| UTM link scheme and weekly measurement sheet | COMPLETE | Private doc |
| Launch checklist | COMPLETE | Private doc; canonical-link item verified fixed on main |
| Review of 8 video concepts against health-ad rules | COMPLETE | Private doc, one verdict and fix per concept |
| Ready-to-shoot scripts for the founder's 3 picks (videos 1, 2, 4) | COMPLETE | Private doc: shot timing, words, captions |
| Real-app footage for videos (made-up data only) | COMPLETE | 4 vertical 1080x1920 clips and 28 screenshots, sent to the founder |
| Verify ad claims in the real app | COMPLETE | See "Tests performed" |
| Record which ad brought each sign-up (UTM tags saved with sign-ups) | BLOCKED | Needs a backend change; see "Blockers" |
| Spanish-language ads | BLOCKED | App labels Spanish as a preliminary translation pending medical review |
| Ad-policy review by the legal-advertising agent | NOT STARTED | Owned by that agent |
| Create accounts, launch, spend | NOT STARTED | Founder only, by design |

**Tests performed (2026-10-23, local copy of main at 8d6e756, phone-sized Chromium, signed out):**

- Two site samples (`#try=maria-blood-test` in English and Spanish, `#try=maria-ct-chest`) and one
  typed, made-up report with every value in range: all loaded and explained, with no page errors.
  The third sample (`#try=raj-kidney-heart-uk`) was not run.
- Network log during each explanation: 0 POST requests and 0 requests carrying report content.
  The only outside requests were Google Fonts and the API health check. Claim "read on your device" holds.
- Spanish switch works; the app shows a "preliminary translation, pending review" notice.
- Canonical and og:url point to followthroughhealth.com on main.

**Changed files:** `docs/agent-task-completion.md` (this file). No site code changed.

**Blockers and approvals needed:**

1. UTM capture on sign-ups needs the backend's `/product/early-access` and `/product/events`
   endpoints to accept and store `utm_source`, `utm_campaign` and `utm_content` (short,
   allow-listed text, no health data), and the founder view to show them. The Ads agent was not
   allowed to attach the backend repository in this session, so the frontend change was not made:
   sending fields the backend may reject could break sign-ups.
2. Spanish ads wait for the medical translation review.
3. Every ad, image and video needs the legal-advertising agent's review, then the founder's approval.
4. Accounts, budget and launch are the founder's actions.
