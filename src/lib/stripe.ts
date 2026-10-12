import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

/**
 * Destination charges with an application fee.
 * The student pays the full session price on the platform account.
 * Stripe transfers the tutor share to the connected Express account.
 * The application fee (our commission) stays on the platform and is intended
 * to absorb ordinary card-processing fees, so the tutor's percentage is intact.
 */
export async function createSessionCheckout(options: {
  bookingId: string;
  amountCents: number;
  platformShareCents: number;
  tutorName: string;
  durationMin: number;
  studentEmail: string;
  destinationAccountId: string;
  successPath: string;
  cancelPath: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: options.studentEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: options.amountCents,
          product_data: {
            name: `Tutoring session with ${options.tutorName}`,
            description: `${options.durationMin} minutes · 1% Better Tutoring`,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: options.platformShareCents,
      transfer_data: { destination: options.destinationAccountId },
      metadata: { bookingId: options.bookingId },
    },
    metadata: { bookingId: options.bookingId },
    success_url: `${origin}${options.successPath}`,
    cancel_url: `${origin}${options.cancelPath}`,
  });
}

export async function refundConnectedPayment(paymentIntentId: string) {
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}
