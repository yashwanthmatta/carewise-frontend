# Finding the first three clinics: outreach kit

**Goal:** three practices that say they would start a **paid** DocBridge pilot once it's cleared for real
patients (clinical review, legal review, a signed Business Associate Agreement). Until then, every
conversation and session uses made-up clinics and sample labs only.

What's in this kit:
- `docs/outreach/clinic-messages.md`: emails, a follow-up, a LinkedIn note, a warm intro and a
  thank-you. CI checks their wording.
- This file: who to contact, the 20-minute call script, the pricing questions, honest answers to hard
  questions, and how to track progress.
- `docs/outreach/clinic-pipeline.csv`: the tracker (business contacts only, never patient information).
- `docs/pilot-clinic-onboarding.md`: what to do once a clinic says yes.

The founder does the outreach personally. These are drafts for you to send, not something sent
automatically.

## 1. Who to contact

Best first fits (small, decision-maker close to the work):
- Independent primary care, family medicine and internal medicine practices with 1–10 clinicians.
- Direct primary care (DPC) and concierge practices. They often explain results themselves and have
  membership revenue.
- Practices whose website mentions a patient portal and same-week result follow-up.

Who to write to: the practice owner or medical director, or the practice manager in a group. Avoid
large health systems for now: long procurement, EHR requirements and security reviews you can't pass
yet.

Where to find them (public business information only): practice websites, state DPC directories, local
medical society member pages, LinkedIn by title, and introductions from people you know. Don't scrape or
buy lists, and don't email personal addresses.

**Volume plan:** 40 personal emails → expect roughly 8–10 replies → 6–8 calls → 3 pilot commitments.
These are planning numbers, not data. Track your real rates in the CSV and adjust.

## 2. The 20-minute call

**Minutes 0–2: frame it.** "Thanks for the time. This is mostly me learning how you handle lab
results today. DocBridge is early: it's in an evaluation with sample labs, and an independent clinical
review is under way. I'll show it briefly at the end."

**Minutes 2–10: their workflow (listen more than you talk).**
1. When a routine lab comes back, what happens? Who tells the patient, and how (portal message,
   call, letter)?
2. Roughly how long does explaining a typical result take you or your staff? (Write their number
   down. Never quote it back as a claim about DocBridge.)
3. What questions do patients ask most after getting results?
4. What happens when results are normal? And when one value is outside the range?
5. What have you tried to make this easier? What did you like or dislike about it?
6. Who would decide on a tool like this, and who would pay for it?

**Minutes 10–16: the demo.** Open https://followthroughhealth.com/#doctor-demo and share your screen:
1. "Here's a made-up clinic and a sample lab." Show the automatic draft on the left.
2. Edit one sentence on the right: "the clinician always has the final word."
3. Approve, then open the patient page: "this is what the patient sees, with your name on it."
4. Show revoking the link.
Then ask: "What would stop you from using this?"

**Minutes 16–20: value and price (section 3), then the next step.** If they're interested, offer the
30-minute guided session with sample labs (`pilot-clinic-onboarding.md`). If not, ask what would have
to change.

## 3. Pricing questions (testing around $199 a month)

$199 a month is a price **to test**, not an offer. Don't take payment, send an invoice or promise a
start date. Ask these in order and write down the exact answers:

1. "If it worked the way you saw, how would you expect it to be priced: per clinician, per practice or
   per patient message?"
2. "At what monthly price would it be so cheap you'd doubt the quality?"
3. "At what price would it start to feel expensive, but still worth considering?"
4. "At what price would it be too expensive to consider?"
5. "We're considering about $199 a month for a small practice. If it were cleared for real patients
   at that price, would you start a paid pilot?" Note the answer: yes / maybe / no, plus their reason.
6. "What would you need to see first?" (Typical answers: the BAA, clinical sign-off, EHR fit, a
   colleague using it.)

**What counts as a commitment:** "yes" to question 5 plus a named decision-maker and a next step on
the calendar. Ideally they also sign a one-paragraph, non-binding letter of intent. Ask counsel before
using any letter template.

## 4. Honest answers to hard questions

| Question | Honest answer |
|---|---|
| "Is it HIPAA-ready? Will you sign a BAA?" | "Not yet, and that's why the evaluation uses sample labs only. We won't handle real patient information until we have the right agreements and reviews in place." |
| "Is it accurate?" | "Drafts compare each value with the range the lab printed. We test that internally on 68 sample reports, which is not a clinical study, and an independent clinical review is under way. The clinician always edits and approves." |
| "Is this AI?" | "The draft is generated by fixed rules from the lab values, on the device. Nothing is sent to a patient without your approval." |
| "Does it connect to our EHR?" | "No. Today you upload a PDF or paste the lab text. Tell me which EHR you use; it helps us decide what to build." |
| "How do patients get it?" | "A private link you send through your usual channel: email, text or WhatsApp. You can revoke it at any time." |
| "Who else uses it?" | "No clinics use it with real patients yet. You'd be one of the first evaluation practices." |
| "How much time does it save?" | "We haven't measured that yet, and I won't guess. That's something the pilot would measure." |

Never say anything on the banned list in `docs/advertising-library.md` §1, such as compliance or
certification claims, outcome or time-saving claims, or naming other clinics.

## 5. Tracking

Use `docs/outreach/clinic-pipeline.csv` (or a private copy in a spreadsheet). One row per practice:
business contact details, dates, stage and the pricing answers. Never record patient information or
anything a clinician says about a specific patient.

**Stages:** `to-contact` → `emailed` → `followed-up` → `replied` → `call-booked` → `call-done` →
`guided-session` → `pilot-yes` / `pilot-maybe` / `not-now`.

Review it weekly: how many emails sent, replies, calls and "yes" answers to question 5, plus the price
range from questions 2–4. After about 8 calls the price picture is usually clear enough to decide
whether to keep $199 or change it. That decision is the owner's.

## 6. Rules to follow (from the legal and pilot guides)

- Sample labs and made-up clinics only, in calls, demos and sessions. No real patient data, no
  screenshots of a clinic's real results.
- Every commercial email carries your postal address and a clear way to opt out, and opt-outs are
  honoured (CAN-SPAM). One follow-up at most.
- Don't add tracking pixels to links. If you want to count clicks, add `?utm_source=email` to the
  demo link; the site only keeps anonymous daily counts.
- No testimonials or clinic names in marketing without written permission.
