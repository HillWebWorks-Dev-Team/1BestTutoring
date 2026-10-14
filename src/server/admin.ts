"use server";

import { redirect } from "next/navigation";
import { live, platformSettings } from "@/lib/live";
import { notify } from "@/lib/notify";
import { refundConnectedPayment } from "@/lib/stripe";
import { requireRole } from "@/lib/session";

async function setTutorStatus(tutorId: string, status: string, extra: Record<string, string | boolean> = {}) {
  const admin = await requireRole(["ADMIN"]);
  const db = await live();
  const tutor = await db.tutorProfile.update({
    where: { id: tutorId },
    data: {
      status,
      verified: status === "APPROVED",
      active: status === "APPROVED",
      ...extra,
    },
    include: { user: true },
  });
  const copy: Record<string, string> = {
    APPROVED: "Your application was approved. You can finish payout setup and open your calendar.",
    REJECTED: "Your application was not approved at this time.",
    WAITLISTED: "You've been placed on the tutor waitlist. We'll write when a review opens up.",
    MORE_INFO: "We need a bit more information before a decision.",
  };
  await notify({
    userId: tutor.userId,
    email: tutor.user.email,
    type: "APPLICATION",
    title: `Application ${status.replaceAll("_", " ").toLowerCase()}`,
    body: extra.moreInfoRequest ? String(extra.moreInfoRequest) : copy[status] || "Your application status changed.",
    href: "/dashboard/tutor/application",
    dedupeKey: `status:${tutor.id}:${status}:${Date.now()}`,
  });
  void admin;
  redirect("/dashboard/admin/applications?updated=1");
}

export async function approveTutor(formData: FormData) {
  await setTutorStatus(String(formData.get("tutorId")), "APPROVED");
}

export async function rejectTutor(formData: FormData) {
  await setTutorStatus(String(formData.get("tutorId")), "REJECTED", {
    adminNotes: String(formData.get("note") || ""),
  });
}

export async function waitlistTutor(formData: FormData) {
  await setTutorStatus(String(formData.get("tutorId")), "WAITLISTED");
}

export async function requestTutorInfo(formData: FormData) {
  const note = String(formData.get("note") || "Please add more detail and resubmit.");
  await setTutorStatus(String(formData.get("tutorId")), "MORE_INFO", { moreInfoRequest: note });
}

export async function toggleTutorActive(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({ where: { id: String(formData.get("tutorId")) } });
  if (!tutor || tutor.status !== "APPROVED") redirect("/dashboard/admin/tutors");
  await db.tutorProfile.update({ where: { id: tutor.id }, data: { active: !tutor.active } });
  redirect("/dashboard/admin/tutors?updated=1");
}

export async function decideQualification(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({ where: { id: String(formData.get("tutorId")) }, include: { user: true } });
  if (!tutor?.pendingChanges) redirect("/dashboard/admin/tutors");
  if (String(formData.get("decision")) === "approve") {
    const changes = JSON.parse(tutor.pendingChanges) as Record<string, string | number>;
    await db.tutorProfile.update({
      where: { id: tutor.id },
      data: { ...changes, graduationYear: Number(changes.graduationYear), pendingChanges: null },
    });
  } else {
    await db.tutorProfile.update({ where: { id: tutor.id }, data: { pendingChanges: null } });
  }
  await notify({
    userId: tutor.userId,
    email: tutor.user.email,
    type: "PROFILE",
    title: "Qualification review finished",
    body: String(formData.get("decision")) === "approve" ? "Your profile updates are live." : "Those qualification edits were not applied.",
    href: "/dashboard/tutor/profile",
  });
  redirect("/dashboard/admin/tutors?updated=1");
}

export async function createAssignment(formData: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const studentId = String(formData.get("studentId") || "");
  const tutorId = String(formData.get("tutorId") || "");
  const db = await live();
  const student = await db.studentProfile.findUnique({ where: { id: studentId }, include: { user: true } });
  const tutor = await db.tutorProfile.findUnique({ where: { id: tutorId }, include: { user: true } });
  if (!student || !tutor || tutor.status !== "APPROVED") redirect("/dashboard/admin/assignments?error=Choose an approved tutor and a student.");
  await db.assignment.upsert({
    where: { studentId_tutorId: { studentId, tutorId } },
    update: { status: "ACTIVE", endedAt: null, assignedById: admin.id, notes: String(formData.get("notes") || "") },
    create: { studentId, tutorId, assignedById: admin.id, notes: String(formData.get("notes") || ""), status: "ACTIVE" },
  });
  await db.tutoringRequest.updateMany({
    where: { studentId, tutorId, status: "PENDING" },
    data: { status: "APPROVED", resolvedAt: new Date(), adminNote: "Assigned from the admin desk." },
  });
  await notify({
    userId: student.userId,
    email: student.user.email,
    type: "MATCH",
    title: `You're matched with ${tutor.user.name}`,
    body: "You can message, share homework, and book paid sessions.",
    href: "/dashboard/student/tutors",
  });
  await notify({
    userId: tutor.userId,
    email: tutor.user.email,
    type: "MATCH",
    title: `${student.user.name} was assigned to you`,
    body: "Open your students desk to see goals, sessions, and work.",
    href: "/dashboard/tutor/students",
  });
  redirect("/dashboard/admin/assignments?assigned=1");
}

export async function endAssignment(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  await db.assignment.update({
    where: { id: String(formData.get("assignmentId")) },
    data: { status: "ENDED", endedAt: new Date() },
  });
  redirect("/dashboard/admin/assignments?updated=1");
}

export async function resolveRequest(formData: FormData) {
  const decision = String(formData.get("decision"));
  if (decision === "approve") {
    const db = await live();
    const request = await db.tutoringRequest.findUnique({ where: { id: String(formData.get("requestId")) } });
    if (!request) redirect("/dashboard/admin/assignments");
    const nested = new FormData();
    nested.set("studentId", request.studentId);
    nested.set("tutorId", request.tutorId);
    nested.set("notes", String(formData.get("note") || request.message));
    await createAssignment(nested);
    return;
  }
  await requireRole(["ADMIN"]);
  const db = await live();
  const request = await db.tutoringRequest.update({
    where: { id: String(formData.get("requestId")) },
    data: { status: "DECLINED", resolvedAt: new Date(), adminNote: String(formData.get("note") || "") },
    include: { student: { include: { user: true } }, tutor: { include: { user: true } } },
  });
  await notify({
    userId: request.student.userId,
    email: request.student.user.email,
    type: "MATCH",
    title: "Tutoring request updated",
    body: `We aren't assigning ${request.tutor.user.name} right now. You can book another consultation.`,
    href: "/tutors",
  });
  redirect("/dashboard/admin/assignments?updated=1");
}

export async function updatePlatformSettings(formData: FormData) {
  await requireRole(["ADMIN"]);
  const commissionPercent = Number(formData.get("commissionPercent"));
  const minHourlyRateCents = Math.round(Number(formData.get("minRate")) * 100);
  const maxHourlyRateCents = Math.round(Number(formData.get("maxRate")) * 100);
  if (commissionPercent < 0 || commissionPercent > 60 || minHourlyRateCents >= maxHourlyRateCents) {
    redirect("/dashboard/admin/settings?error=Check the commission and rate limits.");
  }
  const current = await platformSettings();
  const db = await live();
  const referralReferrerCreditCents = Math.max(0, Math.round(Number(formData.get("referrerCredit") || 0) * 100));
  const referralRefereeCreditCents = Math.max(0, Math.round(Number(formData.get("refereeCredit") || 0) * 100));
  await db.platformSettings.update({
    where: { id: current.id },
    data: {
      commissionPercent,
      minHourlyRateCents,
      maxHourlyRateCents,
      consultationMinutes: Number(formData.get("consultationMinutes") || 15),
      sessionMinutes: Number(formData.get("sessionMinutes") || 60),
      cancelWindowHours: Number(formData.get("cancelWindowHours") || 24),
      referralReferrerCreditCents,
      referralRefereeCreditCents,
    },
  });
  redirect("/dashboard/admin/settings?saved=1");
}

export async function adminRefund(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  const booking = await db.booking.findUnique({
    where: { id: String(formData.get("bookingId")) },
    include: { transaction: true, student: { include: { user: true } }, tutor: { include: { user: true } } },
  });
  if (!booking?.transaction) redirect("/dashboard/admin/finance?error=That booking has no payment.");
  if (booking.transaction.stripePaymentIntentId) {
    await refundConnectedPayment(booking.transaction.stripePaymentIntentId);
  }
  await db.transaction.update({
    where: { id: booking.transaction.id },
    data: { status: "REFUNDED", refundedCents: booking.transaction.amountCents },
  });
  await db.booking.update({
    where: { id: booking.id },
    data: { status: "REFUNDED", cancelReason: String(formData.get("reason") || "Refunded by admin") },
  });
  if (booking.creditAppliedCents > 0) {
    const { restoreBookingCredit } = await import("@/lib/referrals");
    await restoreBookingCredit({
      studentId: booking.studentId,
      bookingId: booking.id,
      creditCents: booking.creditAppliedCents,
    });
  }
  await notify({
    userId: booking.student.userId,
    email: booking.student.user.email,
    type: "PAYMENT",
    title: "Session refunded",
    body: "The charge for this session was refunded.",
    href: "/dashboard/student/payments",
  });
  redirect("/dashboard/admin/finance?refunded=1");
}

export async function handleContact(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  await db.contactMessage.update({
    where: { id: String(formData.get("id")) },
    data: { handled: true },
  });
  redirect("/dashboard/admin/inbox?updated=1");
}

export async function resolveSafety(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  await db.safetyReport.update({
    where: { id: String(formData.get("id")) },
    data: { status: String(formData.get("status") || "RESOLVED") },
  });
  redirect("/dashboard/admin/safety?updated=1");
}

export async function adminLinkParent(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  const parent = await db.parentProfile.findUnique({ where: { id: String(formData.get("parentId")) } });
  if (!parent) redirect("/dashboard/admin/students?error=Choose a parent account.");
  await db.studentProfile.update({
    where: { id: String(formData.get("studentId")) },
    data: { parentId: parent.id },
  });
  redirect("/dashboard/admin/students?linked=1");
}

export async function saveAdminTutorNotes(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  await db.tutorProfile.update({
    where: { id: String(formData.get("tutorId")) },
    data: { adminNotes: String(formData.get("adminNotes") || "") },
  });
  redirect("/dashboard/admin/tutors?updated=1");
}

export async function setReviewPublished(formData: FormData) {
  await requireRole(["ADMIN"]);
  const db = await live();
  const reviewId = String(formData.get("reviewId") || "");
  const published = String(formData.get("published") || "") === "1";
  if (!reviewId) redirect("/dashboard/admin/reviews?error=Choose a review.");
  await db.review.update({
    where: { id: reviewId },
    data: { published },
  });
  const { revalidatePath, revalidateTag } = await import("next/cache");
  revalidateTag("home");
  revalidatePath("/tutors");
  redirect(`/dashboard/admin/reviews?${published ? "published" : "hidden"}=1`);
}
