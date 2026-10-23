# Security review: open and closed items

Last updated: 2026-10-23. Full assessment: `carewise-production-backend/docs/security-assessment-2026-10-22.md`.
Never claim HIPAA compliance, zero data retention or legal approval without written evidence.

## Open

| ID | Item | Severity | Owner / next step |
|---|---|---|---|
| H2 | Production database allows connections from any address (`0.0.0.0/0`) | High | Owner: (1) in Render → carewise-api → Environment, confirm `CAREWISE_DATABASE_URL` is the **internal** address (no `.render.com` after `@`); if not, switch to the Internal Database URL and redeploy; (2) remove `0.0.0.0/0` under carewise-postgres → Networking; (3) run the live checks |
| M1 | Saved results summaries, lab tracker values and care-plan content are plain database fields (disk-encrypted by Render, not app-encrypted) | Medium | Security reviewer approves the migration design in the assessment. **No migration without approval** |
| M2 | Single field-encryption key, no rotation | Medium | Confirm it's a generated Fernet key; plan key versioning (in the design) |
| M3 | No BAAs (Render HIPAA workspace, AWS, Anthropic, email provider) | Medium (legal) | Before any real patient data. Until then, synthetic or de-identified data only |
| M4 | Global staff roles can open any patient profile; staff two-step sign-in not required | Medium | Owner decision |
| V1 | Anthropic API retention terms for this account | High (trust) | Owner requests written terms; the site says only that our servers don't save help-chat questions |
| A1 | No crash reporting; alerting depends on GitHub issues | Low | Owner approval for a crash SDK; external uptime monitor |

## Closed (with evidence)

| Item | Fix | Test |
|---|---|---|
| Staff role worked before email verification (could read every profile) | Role needs a verified email | `test_staff_role_waits_for_email_verification` (fails on the old code) |
| File names in the audit log | No longer recorded | `test_audit_log_does_not_record_report_file_names` |
| Cross-account access (reports, labs, meds, care plans, doctor links, reminders) | Already enforced | Cross-account tests in backend `tests/api` |
| DocBridge: other clinics, front desk, approved content, expired/revoked links, anonymous access | Enforced | `test_docbridge.py` (15 tests) |
| Patient AI questions during the evaluation | Locked on the server until the safety check | `test_patient_questions_stay_locked_until_the_safety_check` |
| Unused Android permissions (storage, draw-over-apps, vibrate) | Blocked in `app.json` | Verified with `expo prebuild`: only INTERNET remains |
| Doctor demo touching real data | Runs entirely in the browser | Browser test: zero server calls |
