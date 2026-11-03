# One reminder list: plan

Status: proposal for the founder. No code yet. Feeds row 8 ("Reminders") of `docs/ui-ux-redesign-progress.md`.

## The problem today

The website has three separate places that make reminders:

| Where | What it does | Saved where | Alerts |
|---|---|---|---|
| "Medicine reminders" panel (`reminders.js`) | Medicine times, phone calls, "Taken" button, calendar file | Account (server) | Calendar file; phone call if set up; email to the family if not confirmed |
| "Reminder planner" panel (`script.js`, `carewiseReminders`) | Check-ins, refills, report reviews, clinician follow-ups, meal prep | This browser only | None. The panel says so. |
| "Add to calendar" under a lab result (`downloadLabReminder`) | All-day reminder on the date the doctor gave for the next test | Nowhere (just a file) | Calendar file only |

People don't know which one to use. Planner items vanish when the browser is cleared or on another device. Nothing ties a lab follow-up date to the rest.

## The plan, in three steps

**Step 1. One list, no new data (website only, no approval needed).**
- Show one "Reminders" section. It shows account medicine reminders first, then planner items with a clear "Only on this device" tag.
- Rename "Reminder planner" to "Other reminders (this device only)".
- Under a lab result, after "Add to calendar", show "Also add to your reminders" (adds a planner item with the date the person typed).
- Every item shows: what to remember, the date and time, whether alerts are on, and Edit / Done / Delete.
- Tests: the existing smoke test, plus one browser test that adds a planner item and sees it in the one list.

**Step 2. Save all reminder types to the account (needs your approval: new database table).**
- New types: appointment, next test, visit preparation, other. Each has a date the person enters or confirms, never a date the app makes up.
- Next-test dates read from a report are shown as a suggestion. The person must confirm them before they're saved.
- Same privacy rules as medicine reminders: the label is encrypted, and lock-screen text stays "FollowThrough Health: You have a reminder."
- A one-time "Move to my account" button copies this-device planner items to the account.

**Step 3. Alerts for the new types (needs your approval: notification channel).**
- Calendar file for each, the same way as today.
- Email to the account owner the day before an appointment, only if the person turns it on.
- Phone notifications come later with the mobile app work.

## What stays out

- No medicine names or doses suggested by the app.
- No retest dates worked out from lab values.
- No sharing with family members until caregiver sharing is approved.

## Decisions for you

1. OK to do step 1 now? (Website only, low risk.)
2. Approve the database table for step 2?
3. Which alerts for step 3: calendar only, or calendar plus optional email?
