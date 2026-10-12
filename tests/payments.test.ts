import assert from "node:assert/strict";
import test from "node:test";
import { estimateProcessingFee, netPlatformEarnings, sessionPrice, splitAmount } from "../src/lib/payments";

test("splits a $100 session 70/30 without touching the tutor share for fees", () => {
  const split = splitAmount(10000, 30);
  assert.deepEqual(split, { platformShareCents: 3000, tutorShareCents: 7000 });
  const fee = estimateProcessingFee(10000);
  assert.equal(fee, 320);
  assert.equal(netPlatformEarnings(split.platformShareCents, fee), 2680);
  assert.equal(split.tutorShareCents, 7000);
});

test("gives remainder cents to the tutor so the parts add up", () => {
  const split = splitAmount(10001, 30);
  assert.equal(split.platformShareCents + split.tutorShareCents, 10001);
  assert.equal(split.platformShareCents, 3000);
});

test("honors other commission settings", () => {
  assert.deepEqual(splitAmount(8000, 20), { platformShareCents: 1600, tutorShareCents: 6400 });
  assert.deepEqual(splitAmount(5000, 0), { platformShareCents: 0, tutorShareCents: 5000 });
});

test("prices partial hours from the hourly rate", () => {
  assert.equal(sessionPrice(10000, 60), 10000);
  assert.equal(sessionPrice(10000, 90), 15000);
});
