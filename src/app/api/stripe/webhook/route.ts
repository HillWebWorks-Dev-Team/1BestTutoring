import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { confirmPaidBooking } from "@/lib/confirm-paid-booking";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

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
