import assert from "node:assert/strict";
import test from "node:test";
import {
  bucketBookingsByMonth,
  bucketRevenueByMonth,
  consultConversion,
  retentionRate,
} from "../src/lib/analytics";

test("buckets succeeded revenue into the last six months", () => {
  const now = new Date(2026, 9, 14); // Oct 2026
  const points = bucketRevenueByMonth(
    [
      { createdAt: new Date(2026, 9, 2), amountCents: 5000 },
      { createdAt: new Date(2026, 9, 10), amountCents: 2500 },
      { createdAt: new Date(2026, 8, 1), amountCents: 1000 },
      { createdAt: new Date(2025, 0, 1), amountCents: 99999 },
    ],
    now,
    6,
  );
  assert.equal(points.length, 6);
  assert.equal(points[5].label, "Oct");
  assert.equal(points[5].value, 7500);
  assert.equal(points[4].label, "Sep");
  assert.equal(points[4].value, 1000);
});

test("buckets consults and sessions by month", () => {
  const now = new Date(2026, 9, 14);
  const points = bucketBookingsByMonth(
    [
      { startsAt: new Date(2026, 9, 1), type: "CONSULTATION" },
      { startsAt: new Date(2026, 9, 2), type: "SESSION" },
      { startsAt: new Date(2026, 9, 3), type: "SESSION" },
    ],
    now,
    3,
  );
  assert.equal(points[2].consults, 1);
  assert.equal(points[2].sessions, 2);
});

test("retention is share of paying students with a second session", () => {
  assert.deepEqual(retentionRate([1, 1, 3, 2, 0]), { rate: 50, returning: 2, active: 4 });
  assert.deepEqual(retentionRate([]), { rate: 0, returning: 0, active: 0 });
});

test("consult conversion matches student-tutor pairs", () => {
  const result = consultConversion({
    consultPairs: [
      { studentId: "s1", tutorId: "t1" },
      { studentId: "s2", tutorId: "t2" },
      { studentId: "s1", tutorId: "t1" },
    ],
    assignmentPairs: [{ studentId: "s1", tutorId: "t1" }],
  });
  assert.equal(result.converted, 2);
  assert.equal(result.total, 3);
  assert.equal(result.rate, 67);
});
