# Security review: open and closed items

Last updated: 2026-10-24. Full assessment: `carewise-production-backend/docs/security-assessment-2026-10-22.md`.
Never claim HIPAA compliance, zero data retention or legal approval without written evidence.

## Open

| ID | Item | Severity | Owner / next step |
|---|---|---|---|
| H2 | Production database allows connections from any address (`0.0.0.0/0`) | High | **Evidence 2026-10-23:** database logs for 2026-10-21 to 2026-10-23 show the API connecting only from private `10.x` addresses (Render internal network) and no connections from public addresses, so removing `0.0.0.0/0` should not affect the app. Clean logs alone are not proof: follow `carewise-production-backend/docs/runbooks/database-network-restriction.md` (live connection-string check, outside users, backups, a rehearsal of the undo step, verification and rollback). The available tools can't change this setting. Owner: (1) in Render → carewise-api → Environment, confirm `CAREWISE_DATABASE_URL` is the **internal** address (no `.render.com` after `@`); if not, switch to the Internal Database URL and redeploy; (2) remove `0.0.0.0/0` under carewise-postgres → Networking; (3) run the live checks |
| H3 | **Production token-signing secret is shorter than 32 characters** (found 2026-10-24 by the new `/ready` advisory; value never shown) | High | Owner approval needed, because it changes a production secret. Render → carewise-api → Environment → `CAREWISE_JWT_SECRET` → replace with a long random value (Render's **Generate**, or `python3 -c "import secrets;print(secrets.token_urlsafe(48))"` run on your own computer) → save. Effect: current sign-in tokens stop working, and the website silently gets new ones using its refresh token (refresh tokens are random database values, not signed with this secret). The production monitor's warning disappears once it's long enough |
| H4 | **The live site doesn't send the headers in `render.yaml`**: production monitor 2026-10-24 found only 1 of 4 (no HSTS, no X-Frame-Options, no CSP header) | High (website) | **Partly fixed:** every page now carries the Content-Security-Policy as a `<meta>` tag (frontend PR #121), checked in CI and by the monitor. A `<meta>` policy can't set HSTS or block framing, so the owner adds these in Render → carewise-frontend → Settings → Headers (path `/*`): `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Or connect the service to `render.yaml` as a Blueprint. The monitor warns until they're served |
| D1 | Mobile build tools (Expo CLI → node-forge, zod, uuid) have known advisories | Low | None ship in the app (checked the built Android bundle). node-forge 1.4.0 is the newest release, so no fix exists yet; npm's suggested "fix" is a 4-major-version Expo downgrade. Dependabot raises security updates when available |
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
| pypdf 6.19 (11 CVEs) parsing uploaded PDFs | `pypdf>=6.21.2`; production installs 6.21.2 (Render build log 2026-10-24) | pip-audit clean for app dependencies |
| python-jose (advisory with no fix; barely maintained) | Replaced with PyJWT 2.15.1; old tokens still verify | Full suite with jose uninstalled: 133 passed |
| A validly signed token without a subject crashed the API (500) | Refused with 401 | `test_forged_and_broken_tokens_are_refused` (wrong secret, alg none, expired, no subject, tampered, garbage; fails on the old code) |
| API responses could be cached; no HSTS on the API | `Cache-Control: no-store`, `Strict-Transport-Security` | `test_api_responses_carry_security_headers`; production monitor confirmed both live on 2026-10-24 |
| No Content-Security-Policy on the website | CSP in every page (`<meta>`, generated from `render.yaml` by `scripts/csp_meta.py`); inline scripts and the inline print handler removed | `scripts/eval/csp-check.mjs` in CI, with and without response headers: 16 pages, PDF and photo reading, doctor brief window, tour, `#doctor-demo`, glossary, demo checklist; an injected inline script is blocked; removing the policy makes it fail |
