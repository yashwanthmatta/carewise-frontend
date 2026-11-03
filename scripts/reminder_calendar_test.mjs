// Checks the reminder calendar file: generic lock-screen words, the reminder's own
// time zone, and no extra reminder on a day that was not chosen. Synthetic data only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = { document: { querySelector: () => null } };
context.globalThis = context;
vm.runInNewContext(readFileSync(new URL("../reminders.js", import.meta.url), "utf8"), context);
const { build, buildLab, firstDay } = context.ftReminderCalendar;

const item = { id: "rem_test", person: "Mom", label: "Metformin 500mg", times: ["08:00", "20:30"], days: [], timezone: "America/New_York" };
const now = new Date(Date.UTC(2026, 9, 21, 16, 0)); // Wednesday noon in New York
const ics = build(item, now);

assert.ok(!ics.includes("Metformin"), "the label must not appear in the calendar");
assert.ok(!ics.includes("Mom"), "the person's name must not appear in the calendar");
assert.ok(ics.includes("SUMMARY:FollowThrough Health reminder"));
assert.ok(ics.includes("DESCRIPTION:FollowThrough Health: You have a reminder."));
assert.ok(ics.includes("DTSTART;TZID=America/New_York:20261021T080000"));
assert.ok(ics.includes("DTSTART;TZID=America/New_York:20261021T203000"));
assert.ok(ics.includes("RRULE:FREQ=DAILY"));
assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);

// Mon/Fri only, created on a Wednesday: the first reminder is Friday, not today.
const weekly = build({ ...item, days: ["mon", "fri"] }, now);
assert.ok(weekly.includes("RRULE:FREQ=WEEKLY;BYDAY=MO,FR"));
assert.ok(weekly.includes("DTSTART;TZID=America/New_York:20261023T080000"));
assert.equal(firstDay(["wed"], now, "America/New_York"), "20261021");

// The first date is the reminded person's date, not the caregiver's. 02:00 UTC on
// Thursday 22 Oct is still Wednesday evening in New York, and Thursday in Tokyo.
const lateUtc = new Date(Date.UTC(2026, 9, 22, 2, 0));
assert.ok(build(item, lateUtc).includes("DTSTART;TZID=America/New_York:20261021T080000"));
assert.ok(build({ ...item, timezone: "Asia/Tokyo" }, lateUtc).includes("DTSTART;TZID=Asia/Tokyo:20261022T080000"));
assert.equal(firstDay(["thu"], lateUtc, "America/New_York"), "20261022");

// An odd time zone value falls back to plain local time instead of breaking the file.
const fallback = build({ ...item, timezone: "Bad Zone;X" }, now);
assert.match(fallback, /DTSTART:\d{8}T080000/);
assert.ok(!fallback.includes("TZID"));

// Next-lab reminder: the date the person picked, never shifted by time zone, and
// generic words only (no "labs", no name) because it shows on a locked phone.
const lab = buildLab("2026-11-03", now);
assert.ok(lab.includes("DTSTART;VALUE=DATE:20261103"));
assert.ok(lab.includes("DTEND;VALUE=DATE:20261104"));
assert.ok(lab.includes("SUMMARY:FollowThrough Health reminder"));
assert.ok(lab.includes("DESCRIPTION:FollowThrough Health: You have a reminder."));
assert.ok(!/SUMMARY:.*lab/i.test(lab) && !lab.includes("Mom"));
assert.ok(buildLab("2026-12-31", now).includes("DTEND;VALUE=DATE:20270101"));
assert.equal(buildLab("not a date", now), "");

console.log("Reminder calendar checks passed.");
