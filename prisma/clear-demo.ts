/**
 * Removes seed/demo accounts so the marketplace can take real tutors.
 * Keeps admin@onepercentbetter.com and any users outside that domain.
 *
 * Dry run (default):  npx tsx prisma/clear-demo.ts
 * Apply deletes:      CONFIRM=1 npx tsx prisma/clear-demo.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_DOMAIN = "@onepercentbetter.com";
const KEEP_EMAILS = new Set(["admin@onepercentbetter.com"]);

async function main() {
  const confirm = process.env.CONFIRM === "1";

  const seedUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: SEED_DOMAIN },
      NOT: { email: { in: [...KEEP_EMAILS] } },
    },
    include: {
      studentProfile: { select: { id: true } },
      tutorProfile: { select: { id: true, slug: true } },
      parentProfile: { select: { id: true } },
    },
    orderBy: { email: "asc" },
  });

  const kept = await prisma.user.findMany({
    where: { email: { in: [...KEEP_EMAILS] } },
    select: { email: true, role: true, name: true },
  });

  const userIds = seedUsers.map((user) => user.id);
  const studentIds = seedUsers.map((user) => user.studentProfile?.id).filter(Boolean) as string[];
  const parentIds = seedUsers.map((user) => user.parentProfile?.id).filter(Boolean) as string[];
  const tutorIds = seedUsers.map((user) => user.tutorProfile?.id).filter(Boolean) as string[];

  console.log(`Found ${seedUsers.length} demo user(s) to remove:`);
  for (const user of seedUsers) {
    const detail =
      user.tutorProfile?.slug ||
      (user.studentProfile ? "student" : "") ||
      (user.parentProfile ? "parent" : user.role);
    console.log(`  - ${user.role.padEnd(8)} ${user.email} (${detail})`);
  }
  console.log(`Keeping:`);
  for (const user of kept) {
    console.log(`  - ${user.role.padEnd(8)} ${user.email} (${user.name})`);
  }

  if (!userIds.length) {
    console.log("Nothing to delete.");
    return;
  }

  if (!confirm) {
    console.log("\nDry run only. Re-run with CONFIRM=1 to delete these accounts and related rows.");
    return;
  }

  // ParentProfile has no ON DELETE from StudentProfile.parentId - unlink first.
  if (parentIds.length) {
    await prisma.studentProfile.updateMany({
      where: { parentId: { in: parentIds } },
      data: { parentId: null },
    });
  }

  // Review.author has no cascade; tutor side does, but authors can be students.
  const reviews = await prisma.review.deleteMany({
    where: {
      OR: [{ authorId: { in: userIds } }, ...(tutorIds.length ? [{ tutorId: { in: tutorIds } }] : [])],
    },
  });
  const safety = await prisma.safetyReport.deleteMany({
    where: {
      OR: [{ reporterId: { in: userIds } }, { subjectUserId: { in: userIds } }],
    },
  });
  const referrals = await prisma.referral.deleteMany({
    where: {
      OR: [{ referrerUserId: { in: userIds } }, { referredUserId: { in: userIds } }],
    },
  });
  const credits = studentIds.length
    ? await prisma.creditLedger.deleteMany({ where: { studentId: { in: studentIds } } })
    : { count: 0 };
  const contacts = await prisma.contactMessage.deleteMany({
    where: {
      OR: [{ email: { endsWith: SEED_DOMAIN } }, { email: { endsWith: "@example.com" } }],
    },
  });

  // Profiles / bookings / messages / etc. cascade from User.
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log("\nDeleted:");
  console.log(`  reviews:        ${reviews.count}`);
  console.log(`  safety reports: ${safety.count}`);
  console.log(`  referrals:      ${referrals.count}`);
  console.log(`  credit rows:    ${credits.count}`);
  console.log(`  contact msgs:   ${contacts.count}`);
  console.log(`  users:          ${deletedUsers.count}`);
  console.log("Done. Admin account kept. Approve real tutors from Applications when they apply.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
