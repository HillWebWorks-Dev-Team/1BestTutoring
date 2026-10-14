import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { money } from "@/lib/format";

/** Debit applied credit from the student balance after a paid session confirms. */
export async function debitBookingCredit(options: {
  studentId: string;
  bookingId: string;
  creditCents: number;
}) {
  const credit = Math.max(0, options.creditCents);
  if (!credit) return;

  await prisma.$transaction(async (tx) => {
    const student = await tx.studentProfile.findUnique({ where: { id: options.studentId } });
    if (!student) return;
    const debit = Math.min(credit, student.creditBalanceCents);
    if (!debit) return;
    await tx.studentProfile.update({
      where: { id: options.studentId },
      data: { creditBalanceCents: { decrement: debit } },
    });
    await tx.creditLedger.create({
      data: {
        studentId: options.studentId,
        deltaCents: -debit,
        reason: "BOOKING_APPLY",
        bookingId: options.bookingId,
        note: "Applied to paid tutoring session",
      },
    });
  });
}

/** Restore credit when a credited booking is refunded. */
export async function restoreBookingCredit(options: {
  studentId: string;
  bookingId: string;
  creditCents: number;
}) {
  const credit = Math.max(0, options.creditCents);
  if (!credit) return;

  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { id: options.studentId },
      data: { creditBalanceCents: { increment: credit } },
    });
    await tx.creditLedger.create({
      data: {
        studentId: options.studentId,
        deltaCents: credit,
        reason: "BOOKING_REFUND",
        bookingId: options.bookingId,
        note: "Restored after refund",
      },
    });
  });
}

/**
 * When a referred student completes their first paid session,
 * grant platform credits to referrer and referee.
 */
export async function grantReferralRewards(options: {
  studentId: string;
  studentUserId: string;
  bookingId: string;
}) {
  const priorPaid = await prisma.transaction.count({
    where: {
      status: "SUCCEEDED",
      booking: {
        studentId: options.studentId,
        type: "SESSION",
        id: { not: options.bookingId },
      },
    },
  });
  if (priorPaid > 0) return;

  const referral = await prisma.referral.findFirst({
    where: { referredUserId: options.studentUserId, status: "SIGNED_UP" },
    orderBy: { createdAt: "asc" },
  });
  if (!referral) return;

  const settings =
    (await prisma.platformSettings.findUnique({ where: { id: "default" } })) ??
    (await prisma.platformSettings.create({ data: { id: "default" } }));

  const referrerCredit = Math.max(0, settings.referralReferrerCreditCents);
  const refereeCredit = Math.max(0, settings.referralRefereeCreditCents);
  if (!referrerCredit && !refereeCredit) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "REWARDED", rewardedAt: new Date() },
    });
    return;
  }

  const referrer = await prisma.studentProfile.findFirst({
    where: { userId: referral.referrerUserId },
    include: { user: true },
  });
  const referee = await prisma.studentProfile.findUnique({
    where: { id: options.studentId },
    include: { user: true },
  });
  if (!referrer || !referee) return;

  await prisma.$transaction(async (tx) => {
    const locked = await tx.referral.updateMany({
      where: { id: referral.id, status: "SIGNED_UP" },
      data: { status: "REWARDED", rewardedAt: new Date() },
    });
    if (!locked.count) return;

    if (referrerCredit) {
      await tx.studentProfile.update({
        where: { id: referrer.id },
        data: { creditBalanceCents: { increment: referrerCredit } },
      });
      await tx.creditLedger.create({
        data: {
          studentId: referrer.id,
          deltaCents: referrerCredit,
          reason: "REFERRAL_REWARD",
          referralId: referral.id,
          bookingId: options.bookingId,
          note: "Reward for referring a student who booked",
        },
      });
    }

    if (refereeCredit) {
      await tx.studentProfile.update({
        where: { id: referee.id },
        data: { creditBalanceCents: { increment: refereeCredit } },
      });
      await tx.creditLedger.create({
        data: {
          studentId: referee.id,
          deltaCents: refereeCredit,
          reason: "REFERRAL_WELCOME",
          referralId: referral.id,
          bookingId: options.bookingId,
          note: "Welcome credit after first paid session",
        },
      });
    }
  });

  if (referrerCredit) {
    await notify({
      userId: referrer.userId,
      email: referrer.user.email,
      type: "REFERRAL",
      title: "Referral credit earned",
      body: `${money(referrerCredit)} tutoring credit for inviting ${referee.user.name}. It applies automatically on the next paid session.`,
      href: "/dashboard/student/referrals",
    });
  }
  if (refereeCredit) {
    await notify({
      userId: referee.userId,
      email: referee.user.email,
      type: "REFERRAL",
      title: "Welcome credit added",
      body: `${money(refereeCredit)} tutoring credit is on your account for your next paid session.`,
      href: "/dashboard/student/referrals",
    });
  }
}
