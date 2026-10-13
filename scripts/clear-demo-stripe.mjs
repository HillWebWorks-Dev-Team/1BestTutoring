import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.tutorProfile.updateMany({
  where: { stripeAccountId: { startsWith: "acct_demo_" } },
  data: {
    stripeAccountId: null,
    stripeChargesEnabled: false,
    stripePayoutsEnabled: false,
    stripeDetailsSubmitted: false,
  },
});

console.log("Cleared demo Stripe accounts:", result.count);
await prisma.$disconnect();
