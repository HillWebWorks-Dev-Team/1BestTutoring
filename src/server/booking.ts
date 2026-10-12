"use server";

import { revalidatePath } from "next/cache";
import { canBookPaidSession, isPublicTutor, tutorCanAcceptPayments, withinCancelWindow } from "@/lib/access";
import { paymentsMode } from "@/lib/brand";
import { pushGoogleEvent } from "@/lib/google";
import { live, platformSettings } from "@/lib/live";
import { notify } from "@/lib/notify";
import { estimateProcessingFee, netPlatformEarnings, sessionPrice, splitAmount } from "@/lib/payments";
import { requireUser } from "@/lib/session";
import { buildSlots } from "@/lib/slots";
import { createSessionCheckout, refundConnectedPayment } from "@/lib/stripe";
import { createZoomMeeting } from "@/lib/zoom";

const ACTIVE = ["CONFIRMED", "COMPLETED"] as const;

function freshPendingCutoff() {
  return new Date(Date.now() - 30 * 60 * 1000);
}

export async function getOpenSlots(slug: string, date: string, type: "CONSULTATION" | "SESSION", excludeId?: string) {
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      availability: true,
      blocks: true,
      bookings: true,
    },
  });
  if (!tutor || !isPublicTutor(tutor)) return [];
  const settings = await platformSettings();
  const duration = type === "CONSULTATION" ? settings.consultationMinutes : settings.sessionMinutes;
  const cutoff = freshPendingCutoff();
  const busy = tutor.bookings.filter((booking) => {
    if (excludeId && booking.id === excludeId) return false;
    if (booking.status === "CANCELLED" || booking.status === "REFUNDED") return false;
    if (booking.status === "PENDING_PAYMENT") return booking.createdAt > cutoff;
    return ACTIVE.includes(booking.status as (typeof ACTIVE)[number]) || booking.status === "PENDING_PAYMENT";
  });
  return buildSlots({
    date,
    timeZone: tutor.user.timezone,
    rules: tutor.availability,
    durationMin: duration,
    blocks: tutor.blocks.map((block) => block.date),
    busy,
  }).map((slot) => slot.toISOString());
}

async function studentActor(studentId?: string | null) {
  const user = await requireUser();
  if (user.role === "STUDENT" && user.studentProfile) return { user, student: user.studentProfile };
  if (user.role === "PARENT") {
    const students = user.parentProfile?.students ?? [];
    const student = (studentId && students.find((item) => item.id === studentId)) || null;
    if (student) return { user, student };
    if (!studentId && students[0]) return { user, student: students[0] };
  }
  return { user, student: null };
}

async function attachMeeting(bookingId: string, topic: string, startsAt: Date, durationMin: number) {
  const meeting = await createZoomMeeting({ topic, startsAt, durationMin });
  const db = await live();
  await db.booking.update({
    where: { id: bookingId },
    data: {
      zoomJoinUrl: meeting.joinUrl,
      zoomStartUrl: meeting.startUrl,
      zoomMeetingId: meeting.meetingId,
    },
  });
  return meeting;
}

async function mirrorCalendars(options: {
  studentUser: { googleRefreshToken: string | null; timezone: string };
  tutorUser: { googleRefreshToken: string | null; timezone: string };
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
}) {
  await Promise.all(
    [options.studentUser, options.tutorUser].map(async (person) => {
      if (!person.googleRefreshToken) return;
      await pushGoogleEvent({
        refreshToken: person.googleRefreshToken,
        title: options.title,
        description: options.description,
        startsAt: options.startsAt,
        endsAt: options.endsAt,
        timeZone: person.timezone,
      }).catch(() => undefined);
    }),
  );
}

export async function bookSlot(input: {
  slug: string;
  startsAt: string;
  type: "CONSULTATION" | "SESSION";
  studentId?: string;
  rescheduleId?: string;
}): Promise<{ error?: string; checkoutUrl?: string; next?: string }> {
  const actor = await requireUser();
  if (input.rescheduleId && (actor.role === "TUTOR" || actor.role === "ADMIN")) {
    const settings = await platformSettings();
    const db = await live();
    const ownTutor = await db.tutorProfile.findUnique({ where: { slug: input.slug }, include: { user: true } });
    if (!ownTutor || (actor.role === "TUTOR" && actor.tutorProfile?.id !== ownTutor.id)) {
      return { error: "You can only move your own bookings." };
    }
    const startsAt = new Date(input.startsAt);
    const duration = input.type === "CONSULTATION" ? settings.consultationMinutes : settings.sessionMinutes;
    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
    const dateInTutorTz = new Intl.DateTimeFormat("en-CA", {
      timeZone: ownTutor.user.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(startsAt);
    const open = await getOpenSlots(ownTutor.slug, dateInTutorTz, input.type, input.rescheduleId);
    if (!open.includes(startsAt.toISOString())) return { error: "That time is no longer open. Choose another slot." };
    const moved = await reschedule(input.rescheduleId, actor.id, startsAt, endsAt, settings.cancelWindowHours);
    if (moved.next) moved.next = actor.role === "ADMIN" ? "/dashboard/admin/bookings?rescheduled=1" : "/dashboard/tutor/calendar?rescheduled=1";
    return moved;
  }

  const { user, student } = await studentActor(input.studentId);
  if (!student) return { error: "A student or linked parent account is required to book." };

  const db = await live();
  const tutor = await db.tutorProfile.findUnique({
    where: { slug: input.slug },
    include: { user: true, availability: true, blocks: true },
  });
  if (!tutor || !isPublicTutor(tutor)) return { error: "That tutor is not available." };

  const settings = await platformSettings();
  const duration = input.type === "CONSULTATION" ? settings.consultationMinutes : settings.sessionMinutes;
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { error: "Choose a valid time." };
  const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

  const dateInTutorTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: tutor.user.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startsAt);

  const open = await getOpenSlots(tutor.slug, dateInTutorTz, input.type, input.rescheduleId);
  if (!open.includes(startsAt.toISOString())) return { error: "That time is no longer open. Choose another slot." };

  const assignment = await db.assignment.findUnique({
    where: { studentId_tutorId: { studentId: student.id, tutorId: tutor.id } },
  });
  if (input.type === "SESSION" && !canBookPaidSession(assignment?.status === "ACTIVE")) {
    return { error: "Paid sessions open after our team assigns this tutor to you." };
  }

  if (input.rescheduleId) {
    return reschedule(input.rescheduleId, user.id, startsAt, endsAt, settings.cancelWindowHours);
  }

  const priceCents = input.type === "SESSION" ? sessionPrice(tutor.hourlyRateCents, duration) : 0;
  const split = splitAmount(priceCents, input.type === "SESSION" ? settings.commissionPercent : 0);
  const mode = paymentsMode();
  const needsStripe = input.type === "SESSION" && mode === "stripe";

  if (input.type === "SESSION" && !tutorCanAcceptPayments(tutor, mode)) {
    return { error: "This tutor hasn’t finished Stripe payout setup yet, so paid sessions are paused." };
  }

  const destination = user.role === "PARENT" ? "/dashboard/parent?booked=1" : "/dashboard/student/calendar?booked=1";

  try {
    const booking = await db.$transaction(async (tx) => {
      const cutoff = freshPendingCutoff();
      await tx.booking.updateMany({
        where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
        data: { status: "CANCELLED", cancelReason: "Payment window expired" },
      });
      const clash = await tx.booking.findFirst({
        where: {
          tutorId: tutor.id,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          OR: [
            { status: { in: ["CONFIRMED", "COMPLETED"] } },
            { status: "PENDING_PAYMENT", createdAt: { gt: cutoff } },
          ],
        },
      });
      if (clash) throw new Error("That time was just taken. Please choose another slot.");
      const studentClash = await tx.booking.findFirst({
        where: {
          studentId: student.id,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          status: { in: ["CONFIRMED", "COMPLETED", "PENDING_PAYMENT"] },
        },
      });
      if (studentClash) throw new Error("You already have something on your calendar then.");
      return tx.booking.create({
        data: {
          studentId: student.id,
          tutorId: tutor.id,
          type: input.type,
          status: needsStripe ? "PENDING_PAYMENT" : "CONFIRMED",
          startsAt,
          endsAt,
          timezone: user.timezone,
          durationMin: duration,
          priceCents,
          tutorShareCents: split.tutorShareCents,
          platformShareCents: split.platformShareCents,
          commissionPercent: input.type === "SESSION" ? settings.commissionPercent : 0,
        },
      });
    });

    if (needsStripe) {
      if (!tutor.stripeAccountId) {
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED", cancelReason: "Tutor payout account missing" },
        });
        return { error: "This tutor can’t accept payments yet." };
      }
      const session = await createSessionCheckout({
        bookingId: booking.id,
        amountCents: priceCents,
        platformShareCents: split.platformShareCents,
        tutorName: tutor.user.name,
        durationMin: duration,
        studentEmail: user.email,
        destinationAccountId: tutor.stripeAccountId,
        successPath: `${destination}&session_id={CHECKOUT_SESSION_ID}`,
        cancelPath: `/tutors/${tutor.slug}/book?type=session&payment=cancelled`,
      });
      if (!session?.url) {
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED", cancelReason: "Checkout could not be created" },
        });
        return { error: "Payment could not be started." };
      }
      await db.booking.update({
        where: { id: booking.id },
        data: { stripeCheckoutSessionId: session.id },
      });
      return { checkoutUrl: session.url };
    }

    if (input.type === "SESSION") {
      const fee = estimateProcessingFee(priceCents);
      await db.transaction.create({
        data: {
          bookingId: booking.id,
          amountCents: priceCents,
          tutorShareCents: split.tutorShareCents,
          platformShareCents: split.platformShareCents,
          stripeFeeCents: fee,
          netPlatformCents: netPlatformEarnings(split.platformShareCents, fee),
          status: "SUCCEEDED",
        },
      });
    }

    const label = input.type === "CONSULTATION" ? "Free consultation" : "Tutoring session";
    await attachMeeting(booking.id, `${label} · ${tutor.user.name} & ${student.userId}`, startsAt, duration);
    const studentUser = await db.user.findUniqueOrThrow({ where: { id: student.userId } });
    await mirrorCalendars({
      studentUser,
      tutorUser: tutor.user,
      title: `${label} with ${input.type === "CONSULTATION" ? tutor.user.name : studentUser.name}`,
      description: "Booked on 1% Better Tutoring.",
      startsAt,
      endsAt,
    });
    await notify({
      userId: student.userId,
      email: studentUser.email,
      type: "BOOKING",
      title: `${label} confirmed`,
      body: `You're booked with ${tutor.user.name}. Add it to your calendar from your dashboard.`,
      href: user.role === "PARENT" ? "/dashboard/parent" : "/dashboard/student/calendar",
    });
    await notify({
      userId: tutor.userId,
      email: tutor.user.email,
      type: "BOOKING",
      title: `New ${label.toLowerCase()}`,
      body: `${studentUser.name} booked ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: tutor.user.timezone }).format(startsAt)}.`,
      href: "/dashboard/tutor/calendar",
    });
    revalidatePath("/dashboard");
    return { next: destination };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Booking failed." };
  }
}

async function reschedule(bookingId: string, actorId: string, startsAt: Date, endsAt: Date, windowHours: number) {
  const db = await live();
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { student: { include: { user: true, parent: true } }, tutor: { include: { user: true } } },
  });
  if (!booking || !["CONFIRMED", "PENDING_PAYMENT"].includes(booking.status)) {
    return { error: "That booking can no longer be moved." };
  }
  const parentId = booking.student.parent?.userId;
  const allowed = [booking.student.userId, booking.tutor.userId, parentId].includes(actorId);
  if (!allowed) return { error: "You can’t change this booking." };
  const actorIsTutor = actorId === booking.tutor.userId;
  if (booking.type === "SESSION" && !actorIsTutor && !withinCancelWindow(booking.startsAt, windowHours)) {
    return { error: "This session is inside the late window. Contact support to move it." };
  }

  await db.$transaction(async (tx) => {
    const clash = await tx.booking.findFirst({
      where: {
        id: { not: booking.id },
        tutorId: booking.tutorId,
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING_PAYMENT"] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (clash) throw new Error("That time is no longer open.");
    await tx.booking.update({ where: { id: booking.id }, data: { startsAt, endsAt } });
  });

  await attachMeeting(
    booking.id,
    `${booking.type === "CONSULTATION" ? "Free consultation" : "Tutoring session"} · rescheduled`,
    startsAt,
    booking.durationMin,
  );
  await notify({
    userId: booking.student.userId,
    email: booking.student.user.email,
    type: "BOOKING",
    title: "Session rescheduled",
    body: `Your time with ${booking.tutor.user.name} has moved.`,
    href: "/dashboard/student/calendar",
  });
  await notify({
    userId: booking.tutor.userId,
    email: booking.tutor.user.email,
    type: "BOOKING",
    title: "Session rescheduled",
    body: `${booking.student.user.name} moved a booking.`,
    href: "/dashboard/tutor/calendar",
  });
  revalidatePath("/dashboard");
  return { next: "/dashboard/student/calendar?rescheduled=1" };
}

export async function cancelBooking(formData: FormData) {
  const user = await requireUser();
  const db = await live();
  const settings = await platformSettings();
  const booking = await db.booking.findUnique({
    where: { id: String(formData.get("bookingId")) },
    include: {
      transaction: true,
      student: { include: { user: true, parent: true } },
      tutor: { include: { user: true } },
    },
  });
  if (!booking) return;
  const allowed = [booking.student.userId, booking.tutor.userId, booking.student.parent?.userId, user.role === "ADMIN" ? user.id : ""].includes(user.id);
  if (!allowed) return;
  const reason = String(formData.get("reason") || "Cancelled");
  const tutorSide = user.id === booking.tutor.userId || user.role === "ADMIN";
  const onTime = withinCancelWindow(booking.startsAt, settings.cancelWindowHours);
  if (booking.type === "SESSION" && booking.priceCents > 0 && !tutorSide && !onTime) {
    const back = user.role === "TUTOR" ? "/dashboard/tutor/calendar" : "/dashboard/student/calendar";
    const { redirect } = await import("next/navigation");
    redirect(`${back}?error=This session is inside the late-cancel window. Contact support and we’ll review a refund.`);
  }

  if (booking.transaction?.stripePaymentIntentId && (tutorSide || onTime)) {
    await refundConnectedPayment(booking.transaction.stripePaymentIntentId).catch(() => undefined);
  }
  if (booking.transaction && (tutorSide || onTime || booking.priceCents === 0)) {
    await db.transaction.update({
      where: { id: booking.transaction.id },
      data: { status: "REFUNDED", refundedCents: booking.transaction.amountCents },
    });
  }
  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelReason: reason },
  });
  await notify({
    userId: booking.student.userId,
    email: booking.student.user.email,
    type: "BOOKING",
    title: "Booking cancelled",
    body: reason,
    href: "/dashboard/student/calendar",
  });
  await notify({
    userId: booking.tutor.userId,
    email: booking.tutor.user.email,
    type: "BOOKING",
    title: "Booking cancelled",
    body: `${booking.student.user.name}: ${reason}`,
    href: "/dashboard/tutor/calendar",
  });
  revalidatePath("/dashboard");
}

export async function requestTutor(formData: FormData) {
  const { user, student } = await studentActor(String(formData.get("studentId") || "") || null);
  const { redirect } = await import("next/navigation");
  if (!student) redirect("/login?next=/tutors");
  const db = await live();
  const tutor = await db.tutorProfile.findFirst({
    where: { slug: String(formData.get("slug") || "") },
    include: { user: true },
  });
  if (!tutor || !isPublicTutor(tutor)) redirect("/tutors");
  if (!student || !tutor) return;
  const assignment = await db.assignment.findUnique({
    where: { studentId_tutorId: { studentId: student.id, tutorId: tutor.id } },
  });
  if (assignment?.status === "ACTIVE") redirect("/dashboard/student/tutors");
  const message = String(formData.get("message") || "").trim();
  const goals = String(formData.get("goals") || student.goals || "").trim();
  if (message.length < 10) redirect(`/tutors/${tutor.slug}?error=Tell us briefly what you want to work on.`);
  await db.tutoringRequest.create({
    data: { studentId: student.id, tutorId: tutor.id, message, goals },
  });
  const studentUser = await db.user.findUniqueOrThrow({ where: { id: student.userId } });
  const { notifyAdmins } = await import("@/lib/notify");
  await notifyAdmins({
    type: "MATCH",
    title: `${studentUser.name} requested ${tutor.user.name}`,
    body: message.slice(0, 180),
    href: "/dashboard/admin/assignments",
  });
  await notify({
    userId: tutor.userId,
    email: tutor.user.email,
    type: "MATCH",
    title: "A student requested to continue",
    body: "Our team reviews the match before anyone is assigned.",
    href: "/dashboard/tutor",
  });
  redirect(user.role === "PARENT" ? "/dashboard/parent?requested=1" : "/dashboard/student?requested=1");
}
