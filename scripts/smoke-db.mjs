import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const prisma = new PrismaClient();
const [users, tutors, bookings, withZoom, paymentsMode] = await Promise.all([
  prisma.user.count(),
  prisma.tutorProfile.count({ where: { status: "APPROVED", active: true } }),
  prisma.booking.count(),
  prisma.booking.count({ where: { zoomJoinUrl: { not: null } } }),
  Promise.resolve(process.env.PAYMENTS_MODE),
]);

const stripeReady = await prisma.tutorProfile.count({
  where: { stripeChargesEnabled: true, stripePayoutsEnabled: true },
});

console.log(
  JSON.stringify(
    {
      database: "ok",
      users,
      approvedTutors: tutors,
      bookings,
      bookingsWithZoom: withZoom,
      tutorsStripeReady: stripeReady,
      paymentsMode,
      hasStripeKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      hasZoom: Boolean(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET),
      hasResend: Boolean(process.env.RESEND_API_KEY),
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
