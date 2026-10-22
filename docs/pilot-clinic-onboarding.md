# DocBridge pilot: onboarding the first clinic

A 30–45 minute session with the clinic's lead clinician and, if they have one, a front-desk
person. Run it on a video call with screen sharing, or in person. Use only the sample lab or
de-identified labs.

## Pilot rules (say these at the start)

- **Pilot only:** de-identified or sample labs. No names, birth dates, record numbers,
  addresses or phone numbers anywhere: not in the lab text, the patient reference, the file
  name or the explanation. There is no Business Associate Agreement yet, so real patient
  data must not be entered.
- **The clinician decides.** The draft is a starting point. Nothing reaches a patient until a
  clinician approves it, and the clinic sends the link through its own email, WhatsApp or
  text. FollowThrough Health never sees the patient's address or number.
- **Not a diagnosis, and not urgent care.** The draft explains results against the lab's
  printed range. Urgent results still go through the clinic's normal process (phone call).
- The explanation rules are under independent clinical review and may change.

## Before the session (you)

- [ ] Send the clinician the demo link to try first: **followthroughhealth.com/#doctor-demo**
- [ ] Have 2–3 de-identified sample labs ready, or use the built-in sample.
- [ ] Agree who is the **owner** (manages the team and settings) and who approves (**clinician**).

## Step 1: Create the account (5 min)

1. Open followthroughhealth.com → **Profile** → create an account with the clinician's work email.
2. Verify the email from the message that arrives.
3. Recommended: turn on **two-step sign-in** under Profile (authenticator app).

## Step 2: Set up the clinic (3 min)

1. Open **For doctors**.
2. Enter the clinic name, the clinician's name as patients should see it, and the tone
   (friendly or formal).
3. The person who sets this up is the **owner**.

## Step 3: Invite the team (5 min, optional)

1. Under **Team**, choose a role and tap **Create invite code**:
   - **Clinician (can approve):** can draft, edit, approve and send.
   - **Front desk (drafts only):** can add labs and save drafts, but can't approve or send.
2. Share the code privately. It works once and expires after **7 days**.
3. The teammate creates their own account, opens **For doctors**, enters the code and their name, and taps **Join clinic**.

## Step 4: The first lab, start to finish (10 min)

1. Enter a **patient reference** such as `REF-1042`: made-up digits, never initials.
2. Add the lab: upload the PDF, or paste the text.
3. Tick **"This lab is de-identified or a sample"** (required during the pilot).
4. Tap **Draft explanation**. The AI draft appears on the left and the clinician's version on the right.
5. Check every value in the table against the original lab. Anything marked **check** needs a
   close look.
6. Edit the explanation and questions on the right as needed. "Reset to AI draft" undoes edits.
7. Choose one:
   - **Approve and create patient link:** saves the version shown and creates the link.
   - **Save draft:** stays in the inbox for later.
   - **Needs follow-up call:** marks it for a phone call; nothing is sent.
   - **Reject:** nothing is sent.
8. After approval, tap **Email to patient**, **WhatsApp** or **Text message**. Each opens the clinic's own
   app with the message written; pick the patient there. Or copy the link.
9. Open the link yourself to see exactly what the patient sees.

The patient link works for **30 days**. **Send a new link** replaces it (the old one stops working
at once); **Turn off patient link** stops it immediately, for example if it was sent to the wrong person.

## Step 5: The inbox and history (5 min)

- The inbox shows each lab's status: waiting for review, needs a call, or approved (as drafted or
  with edits), and whether the patient opened it.
- **History** on each lab shows who did what, and when.
- **Visit summary** shows what changed since the last lab for that patient reference, what's
  outside range now, and a suggested visit agenda.
- The numbers at the top show labs waiting, approvals this week, median review time, patients
  who opened, and approvals with no edits.

## Step 6: Settings (owner, 3 min)

- **Keep labs for:** 30, 60, 90 (default), 180 or 365 days. Older labs are deleted automatically
  each night; the activity log is kept.
- **Patient follow-up questions:** off by default. If turned on, patients can ask questions answered
  by AI only from the approved summary and their own values, without a clinician reading each
  answer. Leave it off for the first weeks.
- **Download activity log (CSV):** a record of actions, with no lab values.
- Email intake (forwarding lab PDFs to a clinic address) appears only when it has been set up for
  the clinic. Ask before relying on it.

## What we measure in the pilot

Approvals per week, median review time, the share approved without edits, how often patients
open their link, and the clinician's feedback. Every edit a clinician makes is kept next to the
AI draft, so we can see what doctors change.

## If something goes wrong

| Problem | What to do |
|---|---|
| A link went to the wrong person | Turn off the patient link right away, then send a new one to the right person. |
| A value was read wrong | Don't approve. Fix the explanation, or reject and add the lab again with the corrected text. Tell us which lab layout it was. |
| Real patient details were entered by mistake | Reject the lab and tell us the same day, so we can delete it. |
| The page signs out | DocBridge signs out after 15 minutes without activity, for security. Sign in again. |
| Anything else | Write down the patient reference (never a name) and what happened, and send it to us. |

## Sign-off at the end of the session

- [ ] Clinician has approved at least one sample lab and opened the patient page.
- [ ] Team members (if any) joined with the right roles.
- [ ] Clinic agrees to the pilot rules: de-identified or sample labs only.
- [ ] Follow-up check-in booked for one week later.
