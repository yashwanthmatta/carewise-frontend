# Family health sharing: plan (build after clinical sign-off)

Goal: a patient lets a trusted family member follow their lab results and follow-up dates, with the
patient in control. Planned now; built after the clinical-safety milestone is signed off.

## MVP

1. **Invite.** The patient enters the caregiver's email and picks what to share. The caregiver gets
   an email that says only "{first name} shared health information with you on FollowThrough
   Health" with a sign-in link: no lab values, test names or report details in the email.
2. **Accept.** The caregiver signs in (or creates an account, two-step sign-in recommended) and
   accepts. Nothing is visible before the patient's invite is accepted.
3. **Permissions, read-only by default.** Per share: which people's reports (Me / Mom / Dad),
   which items (all reports, chosen reports only, trends only), and whether follow-up dates are
   included. Caregivers cannot edit, delete, re-share or download originals in the MVP.
4. **Caregiver view.** Trends across reports with each lab's own reference range and date; the same
   summary and cards the patient sees; follow-up dates the patient entered from their doctor.
5. **Revoke.** The patient can end any share at once; the caregiver loses access on the next request.
6. **Access log.** The patient sees who viewed what and when (the backend already keeps audit events
   for clinics; reuse that pattern).

## Data and security

- New tables: `share_grants` (owner, grantee, scope, created, revoked) and `share_access_log`.
- Every caregiver request is checked against an active grant and its scope on the server.
- Shared data is what the patient saved to their account; nothing read only on the device is shared.
- Legal guardianship and personal-representative access are separate from family sharing and are
  out of scope until reviewed by an attorney.

## Done when

- Patient can invite, limit, and revoke; caregiver sees only the granted scope (tested).
- No health details in any email or notification (tested).
- Access log shows every caregiver view.
- Privacy policy and consent text updated and reviewed.
