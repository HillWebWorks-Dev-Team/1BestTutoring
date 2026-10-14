/** Paid tutoring sessions students can review after the meeting ends. */
export function reviewableBookingWhere(studentId: string, now = new Date()) {
  return {
    studentId,
    type: "SESSION" as const,
    review: null,
    OR: [{ status: "COMPLETED" as const }, { status: "CONFIRMED" as const, endsAt: { lte: now } }],
  };
}

export function canLeaveReview(booking: { type: string; status: string; endsAt: Date; review?: unknown }, now = Date.now()) {
  if (booking.type !== "SESSION") return false;
  if (booking.review) return false;
  if (booking.status === "COMPLETED") return true;
  return booking.status === "CONFIRMED" && booking.endsAt.getTime() <= now;
}
