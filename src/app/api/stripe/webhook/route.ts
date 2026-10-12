import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { estimateProcessingFee, netPlatformEarnings } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { createZoomMeeting } from "@/lib/zoom";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Stripe is not configured", { status: 400 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const event = stripe.webhooks.constructEvent(await request.text(), signature, secret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) await confirmPaidBooking(bookingId, session);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.bookingId) {
      await prisma.booking.updateMany({
        where: { id: session.metadata.bookingId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED", cancelReason: "Checkout expired" },
      });
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await prisma.tutorProfile.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeChargesEnabled: Boolean(account.charges_enabled),
        stripePayoutsEnabled: Boolean(account.payouts_enabled),
        stripeDetailsSubmitted: Boolean(account.details_submitted),
      },
    });
  }

  if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (paymentIntentId) {
      await prisma.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: {
          status: event.type === "charge.dispute.created" ? "DISPUTED" : "REFUNDED",
          refundedCents: charge.amount_refunded || 0,
        },
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const bookingId = intent.metadata?.bookingId;
    if (bookingId) {
      await prisma.booking.updateMany({
        where: { id: bookingId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED", cancelReason: "Payment failed" },
      });
      await prisma.transaction.updateMany({
        where: { bookingId },
        data: { status: "FAILED", failureReason: intent.last_payment_error?.message || "Payment failed" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function confirmPaidBooking(bookingId: string, session: Stripe.Checkout.Session) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { student: { include: { user: true } }, tutor: { include: { user: true } }, transaction: true },
  });
  if (!booking || booking.transaction) return;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const fee = estimateProcessingFee(booking.priceCents);
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", stripePaymentIntentId: paymentIntentId || null },
  });
  await prisma.transaction.create({
    data: {
      bookingId: booking.id,
      amountCents: booking.priceCents,
      tutorShareCents: booking.tutorShareCents,
      platformShareCents: booking.platformShareCents,
      stripeFeeCents: fee,
      netPlatformCents: netPlatformEarnings(booking.platformShareCents, fee),
      status: "SUCCEEDED",
      stripePaymentIntentId: paymentIntentId,
    },
  });
  const meeting = await createZoomMeeting({
    topic: `Tutoring session · ${booking.tutor.user.name}`,
    startsAt: booking.startsAt,
    durationMin: booking.durationMin,
  });
  await prisma.booking.update({
    where: { id: booking.id },
    data: { zoomJoinUrl: meeting.joinUrl, zoomStartUrl: meeting.startUrl, zoomMeetingId: meeting.meetingId },
  });
  await notify({
    userId: booking.student.userId,
    email: booking.student.user.email,
    type: "PAYMENT",
    title: "Payment received",
    body: `Your session with ${booking.tutor.user.name} is confirmed.`,
    href: "/dashboard/student/calendar",
  });
  await notify({
    userId: booking.tutor.userId,
    email: booking.tutor.user.email,
    type: "PAYMENT",
    title: "Paid session booked",
    body: `${booking.student.user.name} paid for a session. Your share is recorded.`,
    href: "/dashboard/tutor/earnings",
  });
}
