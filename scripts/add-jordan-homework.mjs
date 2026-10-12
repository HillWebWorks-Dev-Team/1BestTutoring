import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jordan = await prisma.studentProfile.findFirst({
    where: { user: { email: "jordan@onepercentbetter.com" } },
  });
  const maya = await prisma.tutorProfile.findUnique({ where: { slug: "maya-chen" } });
  const omar = await prisma.tutorProfile.findUnique({ where: { slug: "omar-hassan" } });
  if (!jordan || !maya || !omar) throw new Error("Missing Jordan, Maya, or Omar profiles");

  const titles = [
    "Chain rule warm-up",
    "Multivariable sketch set",
    "Microeconomics graph check",
    "Limits review packet",
  ];
  const existing = await prisma.homework.findMany({
    where: { studentId: jordan.id, title: { in: titles } },
    select: { title: true },
  });
  const have = new Set(existing.map((item) => item.title));
  const data = [
    {
      tutorId: maya.id,
      studentId: jordan.id,
      title: "Chain rule warm-up",
      description: "Complete the six warm-up derivatives. Circle any step where the inner function is unclear.",
      subject: "Mathematics",
      dueAt: new Date("2026-10-15T23:00:00.000Z"),
      materialText: "Focus on u-substitution language: name the inner function before you differentiate.",
      status: "ASSIGNED",
    },
    {
      tutorId: omar.id,
      studentId: jordan.id,
      title: "Multivariable sketch set",
      description: "Sketch level curves for problems 2, 4, and 5. Bring one question you want to unpack live.",
      subject: "Mathematics",
      dueAt: new Date("2026-10-20T23:00:00.000Z"),
      materialText: "Use the same scale on both axes so the curves stay comparable.",
      status: "ASSIGNED",
    },
    {
      tutorId: maya.id,
      studentId: jordan.id,
      title: "Microeconomics graph check",
      description: "Redraw the supply-and-demand shift from Tuesday and label the consumer surplus change.",
      subject: "Economics",
      dueAt: new Date("2026-10-14T23:00:00.000Z"),
      status: "SUBMITTED",
      submissionText: "I redrew both equilibria and shaded the surplus triangle. Still unsure about the tax wedge label.",
      submittedAt: new Date("2026-10-11T18:30:00.000Z"),
    },
    {
      tutorId: omar.id,
      studentId: jordan.id,
      title: "Limits review packet",
      description: "Finish the odd-numbered limit problems and note where a graph helped more than algebra.",
      subject: "Mathematics",
      status: "REVIEWED",
      submissionText: "Completed odds 1–11. Graphing helped on the removable discontinuity.",
      feedback: "Good instinct on the removable case. Next time, state the canceled factor before you take the limit.",
      grade: "Solid",
      submittedAt: new Date("2026-09-28T16:00:00.000Z"),
      reviewedAt: new Date("2026-09-29T14:00:00.000Z"),
    },
  ].filter((item) => !have.has(item.title));

  if (!data.length) {
    console.log("Sample homework already present.");
    return;
  }
  await prisma.homework.createMany({ data });
  const total = await prisma.homework.count({ where: { studentId: jordan.id } });
  console.log(`Added ${data.length} homework items. Jordan now has ${total}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
