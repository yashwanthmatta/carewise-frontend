# DocBridge pilot: onboarding the first clinic

A 30–45 minute session with the clinic's lead clinician and, if they have one, a front-desk
person. Run it on a video call with screen sharing, or in person.

**This is an evaluation with synthetic data, not a live patient service.** Until the legal,
security, vendor and clinical reviews are complete, use only the synthetic sample labs in
`docs/pilot-sample-labs/` (or the built-in sample). The evaluation informs product decisions; it
is not clinical approval.

## Pilot rules (say these at the start)

- **Synthetic labs only.** No real patient's labs, names, birth dates, record numbers,
  addresses or phone numbers anywhere: not in the lab text, the patient reference, the file
  name or the explanation. There is no Business Associate Agreement yet, so real patient
  data must not be entered.
- **Patient links go to clinic staff only.** During the evaluation, send approved links only to
  the clinician's own or a colleague's inbox or phone, to see what a patient would receive.
  Never send one to a real patient: a link with health information carries privacy risk even
  when the clinic picks the recipient.
- **The clinician decides.** The draft is a starting point. Nothing is sent until a clinician
  approves it, and links go out through the clinic's own email, WhatsApp or text.
  FollowThrough Health never sees the recipient's address or number.
- **Not a diagnosis, and not urgent care.** The draft explains results against the lab's
  printed range. Urgent results still go through the clinic's normal process (phone call).
- The explanation rules are under independent clinical review and may change.

## Before the session (you)

- [ ] Send the clinician the demo link to try first: **followthroughhealth.com/#doctor-demo**
- [ ] Have the 2–3 synthetic sample labs from `docs/pilot-sample-labs/` ready (PDF and text).
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
   app with the message written. **During the evaluation, send it only to yourself or a
   colleague**, never to a patient. Or copy the link.
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
- **Patient follow-up questions:** locked off for the whole evaluation. The server refuses to turn
  them on until their separate safety check is signed off, and the setting isn't shown until then.
- Every patient page is labelled **"Pilot demonstration"** while DocBridge is pilot-only.
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
| A link went to the wrong person | Turn off the patient link right away, and tell us the same day. |
| A value was read wrong | Don't approve. Fix the explanation, or reject and add the lab again with the corrected text. Tell us which lab layout it was. |
| Real patient details were entered by mistake | Reject the lab and tell us the same day, so we can delete it. |
| The page signs out | DocBridge signs out after 15 minutes without activity, for security. Sign in again. |
| Anything else | Write down the patient reference (never a name) and what happened, and send it to us. |

## Sign-off at the end of the session

- [ ] Clinician has approved at least one sample lab and opened the patient page.
- [ ] Team members (if any) joined with the right roles.
- [ ] Clinic agrees to the evaluation rules: synthetic labs only, links to clinic staff only.
- [ ] One-week follow-up meeting booked (30 minutes).

## One-week follow-up meeting (30 minutes)

Ask, and write down the answers in the clinician's own words:

1. **Accuracy:** Were any values read wrongly, or any explanations wrong or misleading? Which lab,
   which line?
2. **Edits:** What did you change most often, and why? (We also look at the saved draft/edit pairs.)
3. **Usability:** Where did you hesitate or get stuck? How long did a review take compared with
   writing it yourself?
4. **Workflow:** Where would this fit in your day? What would stop you using it with real
   patients once the reviews are done?
5. **Patient view:** Looking at the page a patient would see, is anything unclear, worrying or missing?
6. **Safety:** Was there any result where the draft should have pushed for faster action, or
   pushed too hard?

Afterwards: send safety findings to the clinical reviewer (don't change the frozen explanation
rules directly), log product issues, and share a short summary with the clinic.
