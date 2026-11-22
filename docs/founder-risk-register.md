# Founder risk register

Written 22 Nov 2026. Likelihood and impact are H (high), M (medium) and L (low). The owner is the founder unless named. Due dates are proposals for the founder to confirm.

| # | Risk | Likelihood | Impact | Evidence (22 Nov) | Mitigation | Owner | Due |
|---|---|---|---|---|---|---|---|
| R1 | No proven demand: users don't need or won't return | H | H | No real-user sessions, interviews or retention data | Run `customer-validation-plan.md`; decide on day 90 | Founder | Day 60 |
| R2 | A wrong or over-reassuring explanation harms someone | M | H | Rules `.8` live; no clinician has reviewed any version | Clinical review (B4); incident procedure; named owner | Founder + clinical adviser (TBD) | Day 30 |
| R3 | Database reachable from the whole internet | M | H | `ipAllowList 0.0.0.0/0` | Runbook: close the network after a backup check | Founder | Day 7 |
| R4 | Forged sign-ins via a weak signing key | M | H | Startup warning: `CAREWISE_JWT_SECRET` < 32 bytes | Replace with 48+ random characters | Founder | Day 1 |
| R5 | Older health fields stored without field encryption | M | H | 0023 backfill not run | Back up, then run and verify the backfill | Founder | Day 14 |
| R6 | Data loss with no working restore | L–M | H | Backups unverified; 1 GB disk; no HA | Check the Recovery tab; do a test restore | Founder | Day 7 |
| R7 | The AI Health Guide is broken in production | **Happening** | M | `provider_auth_rejected` since at least 18 Nov; smoke red | Replace `ANTHROPIC_API_KEY`; run the live synthetic test | Founder | Day 1 |
| R8 | Slow or unavailable API (free plan sleeps) | H | M | 6+ cold starts on 21 Nov | Decide on a paid instance (billing) | Founder | Day 14 |
| R9 | Regulatory exposure (results interpretation; lab ordering; clinic data without a BAA) | M | H | No regulatory memo; DocBridge pilot de-identified only; lab testing synthetic | Lawyer review before lab ordering or real clinic data; keep both off | Founder + counsel | Before any launch of those |
| R10 | Overclaiming in copy | M | M | Backend plan text "Explain any lab or scan report", "Lifetime health record" | Fix the wording (B9); extend the claims audit to backend strings | Engineering | Day 14 |
| R11 | Feature sprawl dilutes the core | H | M | 9 product areas, many unvalidated (`core-product-strategy.md`) | Navigation trimmed; pause list | Founder | Day 7 |
| R12 | Single point of failure: no human engineer owns the code | H | H | All code written by AI sessions | Hire or contract a reviewer for security, clinical and billing changes | Founder | Day 60 |
| R13 | Mobile app unproven on devices | H | M | Device test sheet blank; not in the stores | Run `device-test-session.md` on one iPhone and one Android phone | Founder | Day 30 |
| R14 | The clinical review pack doesn't match the live version | **Happening** | M | The pack says `.5` is live; the code is `.8` | Regenerate the pack at `.8` (B4) | Engineering | Day 14 |
| R15 | The security page omits a processor (OpenAI photo reading) | **Happening** | L | The privacy page lists OpenAI; the security page doesn't | Add OpenAI to the security page table | Engineering | Day 7 |
