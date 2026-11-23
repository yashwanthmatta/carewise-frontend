# Security release readiness

Checked on 22 Nov 2026 at 21:00 UTC, against Render (read-only API), the code on `main` and GitHub. This is a factual status, not a certification. **FollowThrough Health does not claim HIPAA compliance**: no Business Associate Agreements are signed and no legal or operational assessment has been done. Nothing in production was changed while writing this.

**Verdict: not ready for real patient data at any scale.**
- Items 1, 4, 5 and 10 are open.
- The sign-in signing key is weak.
- The API runs on Render's free plan.

| # | Requirement | Status | Evidence | Owner action |
|---|---|---|---|---|
| 1 | Database network restricted | **Open** | Render `carewise-postgres` `ipAllowList` = `0.0.0.0/0` ("everywhere") | Follow `carewise-production-backend/docs/runbooks/database-network-restriction.md`: check the internal URL, check backups, rehearse the undo, remove the rule, verify |
| 2 | Private connections only | **Partly verified** | Database logs from 21–23 Oct show only private `10.x` clients (runbook). The live `CAREWISE_DATABASE_URL` hasn't been re-checked | Runbook step 1: confirm the host has no `.oregon-postgres.render.com` suffix |
| 3 | Application-level encryption coverage | **Mostly built** | Names, date of birth, conditions, allergies, medicines, report text, shares and DocBridge data have always been encrypted. 18 more columns are encrypted on write since migration 0023 (3 Nov) | — |
| 4 | Historical rows migrated | **Open** | The 0023 backfill hasn't run in production (`encryption-migration.md` step 3). Older rows in those 18 columns may be plaintext | Back up, then run the backfill (owner approval), then verify with the report step |
| 5 | Key versioning and recovery | **Built, not exercised in production** | Key ring `ftenc:<id>:`, rotation script, tested in CI and local PostgreSQL. Recovery of the key itself (where it's stored outside Render) is undocumented | Record where the field key is backed up. Rehearse a rotation in staging before production |
| 5b | Sign-in token signing key | **Weak** | The startup log still says "`CAREWISE_JWT_SECRET` is shorter than 32 bytes" (last at 21:00 on 22 Nov). Warning added in backend #62 | Replace it with 48+ random characters in Render. Everyone signs in again once |
| 6 | Patient-level authorization | **Verified in code** | Backend #62: `test_cross_account_sweep.py` covers every id route; `test_care_access.py` covers clinician grants | — |
| 7 | Clinic-level isolation | **Verified in code** | `test_docbridge.py::test_every_clinic_route_is_closed_to_other_clinics` | — |
| 8 | Staff MFA | **Built, off** | `CAREWISE_STAFF_TWO_FACTOR_REQUIRED` defaults to false; `test_staff_two_factor.py` | Turn it on once staff have set up two-step sign-in |
| 9 | Sensitive logs | **Fixed in code** | Backend #63: URL tokens redacted from the request log, and staff opening a lab's source is now audited. App log lines carry no health data (reviewed 20 Nov) | — |
| 10 | Backup and recovery | **Unverified** | Render's API doesn't report backups. Disk is 1 GB, autoscaling off, no high availability or replica | Render → `carewise-postgres` → Recovery: note the latest backup and the window. Do one test restore into a new instance |
| 11 | Third-party processors | **Listed, no BAAs** | Privacy page lists Render, Anthropic, Stripe, Twilio, GitHub and OpenAI (photo reading, if switched on). **The security page's service table omits OpenAI** | Add OpenAI to the security page table. Get BAAs before any real clinic data |
| 12 | Account export and deletion | **Built and tested** | `/privacy/me/export`, `DELETE /privacy/me`; `test_privacy_and_security.py`, `your-data.mjs` eval | — |
| — | Hosting reliability | **Weak** | `carewise-api` is on Render's **free** plan: it sleeps when idle, and the first request waits about a minute. 6+ cold starts on 21 Nov with no failures logged | Billing decision for the owner |
| — | AI provider | **Down** | `provider_auth_rejected` on every attempt since at least 18 Nov (latest 22 Nov 14:55). The live smoke has been red for two days | Replace `ANTHROPIC_API_KEY` |

## Order of work (each needs owner approval; none is done by an agent)

1. Replace `ANTHROPIC_API_KEY` and `CAREWISE_JWT_SECRET` in one save.
2. Check backups and do a test restore.
3. Close the database network (runbook).
4. Run the encryption backfill (after the backup).
5. Turn on staff two-step sign-in before any staff account is used.
6. Get an independent review: a penetration test or a security professional's review.
7. Get BAAs before real clinic data.
