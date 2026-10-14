import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { estimateProcessingFee, netPlatformEarnings } from "@/lib/payments";
import { debitBookingCredit, grantReferralRewards } from "@/lib/referrals";
import { createZoomMeeting } from "@/lib/zoom";

export async function confirmPaidBooking(bookingId: string, session: Stripe.Checkout.Session) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: { include: { user: true, parent: { include: { user: true } } } },
      tutor: { include: { user: true } },
      transaction: true,
    },
  });
  if (!booking) return null;
  if (booking.transaction || booking.status === "CONFIRMED") return booking;

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const chargeCents = Math.max(0, booking.priceCents - (booking.creditAppliedCents || 0));
  const fee = estimateProcessingFee(chargeCents);

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", stripePaymentIntentId: paymentIntentId || null },
  });

  await prisma.transaction.create({
    data: {
      bookingId: booking.id,
      amountCents: chargeCents,
      tutorShareCents: booking.tutorShareCents,
      platformShareCents: booking.platformShareCents,
      stripeFeeCents: fee,
      netPlatformCents: netPlatformEarnings(booking.platformShareCents, fee),
      status: "SUCCEEDED",
      stripePaymentIntentId: paymentIntentId,
    },
  });

  await debitBookingCredit({
    studentId: booking.studentId,
    bookingId: booking.id,
    creditCents: booking.creditAppliedCents || 0,
  });
  await grantReferralRewards({
    studentId: booking.studentId,
    studentUserId: booking.student.userId,
    bookingId: booking.id,
  });

  const meeting = await createZoomMeeting({
    topic: `Tutoring session · ${booking.tutor.user.name}`,
    startsAt: booking.startsAt,
    durationMin: booking.durationMin,
  });

  const confirmed = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      zoomJoinUrl: meeting.joinUrl,
      zoomStartUrl: meeting.startUrl,
      zoomMeetingId: meeting.meetingId,
    },
    include: { student: { include: { user: true } }, tutor: { include: { user: true } }, transaction: true },
  });

  await notify({
    userId: booking.student.userId,
    email: booking.student.user.email,
    type: "PAYMENT",
    title: "Payment received",
    body: `Your session with ${booking.tutor.user.name} is confirmed.`,
    href: `/dashboard/bookings/${booking.id}`,
  });
  await notify({
    userId: booking.tutor.userId,
    email: booking.tutor.user.email,
    type: "PAYMENT",
    title: "Paid session booked",
    body: `${booking.student.user.name} paid for a session. Your share is recorded.`,
    href: `/dashboard/bookings/${booking.id}`,
  });
  if (booking.student.parent?.user) {
    await notify({
      userId: booking.student.parent.user.id,
      email: booking.student.parent.user.email,
      type: "PAYMENT",
      title: "Payment received",
      body: `${booking.student.user.name}'s session with ${booking.tutor.user.name} is confirmed.`,
      href: `/dashboard/bookings/${booking.id}`,
    });
  }

  return confirmed;
}
