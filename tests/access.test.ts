import assert from "node:assert/strict";
import test from "node:test";
import {
  canBookPaidSession,
  canMessagePair,
  canViewStudentData,
  isPublicTutor,
  tutorCanAcceptPayments,
  withinCancelWindow,
} from "../src/lib/access";

test("only approved, verified, active tutors are public", () => {
  assert.equal(isPublicTutor({ status: "APPROVED", active: true, verified: true }), true);
  assert.equal(isPublicTutor({ status: "PENDING", active: false, verified: false }), false);
  assert.equal(isPublicTutor({ status: "APPROVED", active: false, verified: true }), false);
});

test("paid booking and messaging require an official assignment", () => {
  assert.equal(canBookPaidSession(false), false);
  assert.equal(canBookPaidSession(true), true);
  assert.equal(canMessagePair(false), false);
  assert.equal(canMessagePair(true), true);
});

test("students cannot see another student's record", () => {
  assert.equal(
    canViewStudentData({
      viewerRole: "STUDENT",
      viewerId: "student-a",
      studentUserId: "student-b",
    }),
    false,
  );
  assert.equal(
    canViewStudentData({
      viewerRole: "TUTOR",
      viewerId: "tutor-1",
      studentUserId: "student-b",
      assignedTutorUserIds: ["tutor-1"],
    }),
    true,
  );
  assert.equal(
    canViewStudentData({
      viewerRole: "PARENT",
      viewerId: "parent-1",
      studentUserId: "student-b",
      parentUserId: "parent-1",
    }),
    true,
  );
});

test("stripe mode withholds payouts until Connect is complete, demo mode does not", () => {
  const tutor = { status: "APPROVED", active: true, stripeChargesEnabled: false, stripePayoutsEnabled: false };
  assert.equal(tutorCanAcceptPayments(tutor, "demo"), true);
  assert.equal(tutorCanAcceptPayments(tutor, "stripe"), false);
  assert.equal(
    tutorCanAcceptPayments({ ...tutor, stripeChargesEnabled: true, stripePayoutsEnabled: true }, "stripe"),
    true,
  );
});

test("late cancellations fall inside the window", () => {
  const starts = new Date("2026-10-20T15:00:00.000Z");
  assert.equal(withinCancelWindow(starts, 24, new Date("2026-10-18T15:00:00.000Z")), true);
  assert.equal(withinCancelWindow(starts, 24, new Date("2026-10-20T00:00:00.000Z")), false);
});
