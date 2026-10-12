import assert from "node:assert/strict";
import test from "node:test";
import { buildSlots } from "../src/lib/slots";

const rules = [{ dayOfWeek: 3, startMin: 9 * 60, endMin: 12 * 60 }];

test("builds hourly slots in the tutor timezone", () => {
  const slots = buildSlots({
    date: "2026-10-14",
    timeZone: "America/New_York",
    rules,
    durationMin: 60,
    now: new Date("2026-10-01T00:00:00.000Z"),
    leadMinutes: 0,
  });
  assert.deepEqual(
    slots.map((slot) => slot.toISOString()),
    ["2026-10-14T13:00:00.000Z", "2026-10-14T14:00:00.000Z", "2026-10-14T15:00:00.000Z"],
  );
});

test("blocks a date and removes overlapping times", () => {
  assert.equal(
    buildSlots({
      date: "2026-10-14",
      timeZone: "America/New_York",
      rules,
      durationMin: 60,
      blocks: ["2026-10-14"],
      now: new Date("2026-10-01T00:00:00.000Z"),
      leadMinutes: 0,
    }).length,
    0,
  );

  const slots = buildSlots({
    date: "2026-10-14",
    timeZone: "America/New_York",
    rules,
    durationMin: 60,
    busy: [{ startsAt: new Date("2026-10-14T14:00:00.000Z"), endsAt: new Date("2026-10-14T15:00:00.000Z") }],
    now: new Date("2026-10-01T00:00:00.000Z"),
    leadMinutes: 0,
  });
  assert.deepEqual(
    slots.map((slot) => slot.toISOString()),
    ["2026-10-14T13:00:00.000Z", "2026-10-14T15:00:00.000Z"],
  );
});

test("does not offer a slot that has already started", () => {
  const slots = buildSlots({
    date: "2026-10-14",
    timeZone: "America/New_York",
    rules,
    durationMin: 60,
    now: new Date("2026-10-14T13:30:00.000Z"),
    leadMinutes: 0,
  });
  assert.deepEqual(
    slots.map((slot) => slot.toISOString()),
    ["2026-10-14T14:00:00.000Z", "2026-10-14T15:00:00.000Z"],
  );
});
