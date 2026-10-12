export function isPublicTutor(tutor: { status: string; active: boolean; verified: boolean }) {
  return tutor.status === "APPROVED" && tutor.active && tutor.verified;
}

export function canBookPaidSession(hasActiveAssignment: boolean) {
  return hasActiveAssignment;
}

export function canMessagePair(hasActiveAssignment: boolean) {
  return hasActiveAssignment;
}

export function canReadHistory(hasAnyAssignment: boolean) {
  return hasAnyAssignment;
}

export function canViewStudentData(options: {
  viewerRole: string;
  viewerId: string;
  studentUserId: string;
  parentUserId?: string | null;
  assignedTutorUserIds?: string[];
}) {
  if (options.viewerRole === "ADMIN") return true;
  if (options.viewerId === options.studentUserId) return true;
  if (options.parentUserId && options.viewerId === options.parentUserId) return true;
  if (options.assignedTutorUserIds?.includes(options.viewerId)) return true;
  return false;
}

export function tutorCanAcceptPayments(
  tutor: { status: string; active: boolean; stripeChargesEnabled: boolean; stripePayoutsEnabled: boolean },
  mode: "demo" | "stripe",
) {
  if (tutor.status !== "APPROVED" || !tutor.active) return false;
  if (mode === "demo") return true;
  return tutor.stripeChargesEnabled && tutor.stripePayoutsEnabled;
}

export function withinCancelWindow(startsAt: Date, windowHours: number, now = new Date()) {
  return startsAt.getTime() - now.getTime() >= windowHours * 60 * 60 * 1000;
}
