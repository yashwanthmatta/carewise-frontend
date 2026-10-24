// Checks the reminder calendar file: generic lock-screen words, the reminder's own
// time zone, and no extra reminder on a day that was not chosen. Synthetic data only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = { document: { querySelector: () => null } };
context.globalThis = context;
vm.runInNewContext(readFileSync(new URL("../reminders.js", import.meta.url), "utf8"), context);
const { build, firstDay } = context.ftReminderCalendar;

const item = { id: "rem_test", person: "Mom", label: "Metformin 500mg", times: ["08:00", "20:30"], days: [], timezone: "America/New_York" };
const now = new Date(2026, 9, 21, 12, 0); // a Wednesday
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
assert.equal(firstDay(["wed"], now).getDate(), 21);

// An odd time zone value falls back to plain local time instead of breaking the file.
assert.ok(build({ ...item, timezone: "Bad Zone;X" }, now).includes("DTSTART:20261021T080000"));

console.log("Reminder calendar checks passed.");
