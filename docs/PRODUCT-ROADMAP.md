# Product roadmap (prioritised backlog)

Last updated: 2026-10-23. Principle: reliability and clarity before new features. Items marked
**needs approval** aren't started without the owner's decision. Nothing here changes clinical rules
without clinician review and a new rules version.

## Now: release gates (no new features)

| # | Item | Why | Risk | Effort | Approval |
|---|---|---|---|---|---|
| 1 | Clinical review of .2 plus the .3–.5 changes | Required before any clinical claim or real patients | — | Clinician time | Owner arranges |
| 2 | Restrict database network access | Highest open security risk | Low if the private URL is confirmed first | 10 min | Owner action |
| 3 | Billing in the mobile app: remove in-app purchase for v1, or add store billing | Store rules (Apple 3.1.1, Play Billing) | Low (remove) or medium (store billing) | Small (remove) or large (store billing) | **Needs approval** |
| 4 | Apple and Google accounts, EAS signing, TestFlight and closed testing builds | Needed to test real builds | Low | 1–2 days of owner setup | Owner |
| 5 | Real-device, VoiceOver and TalkBack session | Accessibility and crash risk on real phones | — | 1 hour | Owner arranges testers |
| 6 | External 5-minute uptime monitor with email alerts | GitHub schedules are best-effort | None | 15 min | Owner account |

## Next: reliability and trust (after the gates)

| # | Item | Benefit | Risk | Approval |
|---|---|---|---|---|
| 7 | Crash reporting (for example Sentry) in the app and website, without health data | Find crashes before users report them | New data processor; privacy-policy update | **Needs approval** |
| 8 | Field-level encryption of saved results (approved design) | Defence in depth for saved health data | Migration risk; follow the reversible plan | **Needs security approval** |
| 9 | Usability test with 10–15 caregivers (`usability-test-kit.md`) | Measure whether people understand it unaided | None | Owner recruits |
| 10 | Make iPad support a decision (`supportsTablet`) | iPad needs its own screenshots and testing | Low | Owner |

## Later: value for returning users (only after clinical and security approval)

| # | Item | Benefit | Risk | Approval |
|---|---|---|---|---|
| 11 | Caregiver sharing with permissions and revocation (`caregiver-sharing-plan.md`) | Fits the family audience | Privacy and authorization complexity | **Needs approval** |
| 12 | Per-test trend chart across reports | A reason to come back | Comparing different labs or units | Clinical input |
| 13 | Follow-up checklist from doctor-recommended dates | Remember what comes next | Must not suggest treatment | Clinical input |

## Not planned (documented so they aren't built by accident)

New AI medical advice features; symptom checkers; medicine dosing or interaction checks; real
patient DocBridge use before BAAs and clinical sign-off.
