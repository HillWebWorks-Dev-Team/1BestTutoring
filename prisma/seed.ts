import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { estimateProcessingFee, netPlatformEarnings, splitAmount } from "../src/lib/payments";

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync("OnePercent!2026", 10);

const weekdayRules = [1, 2, 3, 4].map((dayOfWeek) => ({ dayOfWeek, startMin: 16 * 60, endMin: 20 * 60 }));
const saturday = { dayOfWeek: 6, startMin: 10 * 60, endMin: 13 * 60 };

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", commissionPercent: 30, minHourlyRateCents: 2500, maxHourlyRateCents: 30000 },
  });

  await prisma.user.create({
    data: { name: "HillWebWorks", email: "admin@onepercentbetter.com", role: "ADMIN", passwordHash, timezone: "America/New_York" },
  });

  const tutors = [
    tutor("Maya Chen", "maya.chen@onepercentbetter.com", "maya-chen", "Harvard University", "Economics", "A.B.", 2023, 9500, "Mathematics, Economics, SAT / ACT Prep", "High School, College", true, false, "Maya treats tutoring like office hours: a clear problem, a quieter explanation, and one thing to practice before next week.", "Three years of peer tutoring in economics and calculus, plus a summer as a teaching fellow for introductory microeconomics.", "Phi Beta Kappa. Hoopes Prize nominee.", "SAT 1560"),
    tutor("James Okonkwo", "james.okonkwo@onepercentbetter.com", "james-okonkwo", "Yale University", "Computer Science", "B.S.", 2022, 11000, "Computer Science, Mathematics", "High School, College", true, true, "James likes the moment a program stops being magic and starts being a set of decisions a student can defend.", "Taught introductory Python and data structures as an undergraduate learning assistant.", "Distinction in the major.", "SAT 1540"),
    tutor("Sofia Alvarez", "sofia.alvarez@onepercentbetter.com", "sofia-alvarez", "Princeton University", "Mathematics", "A.B.", 2024, 9000, "Mathematics, Physics, SAT / ACT Prep", "Middle School, High School", true, true, "Sofia is patient with the ugly middle of a proof, which is usually where a student actually learns.", "Tutored algebra through AP Calculus for a nonprofit in Newark.", "Departmental prize in analysis.", "SAT Math 800"),
    tutor("Ethan Park", "ethan.park@onepercentbetter.com", "ethan-park", "Columbia University", "Physics", "B.S.", 2021, 8500, "Physics, Mathematics", "High School, College", false, false, "Ethan teaches physics as a chain of models, not a pile of formulas.", "Lab TA for mechanics and electromagnetism.", "Magna cum laude.", "Physics GRE 890"),
    tutor("Amelia Wright", "amelia.wright@onepercentbetter.com", "amelia-wright", "University of Pennsylvania", "Biology", "B.A.", 2023, 8000, "Biology, Chemistry", "High School, College", false, true, "Amelia is good at turning a dense chapter into a study system a student can repeat.", "Tutored organic chemistry and AP Biology privately for two years.", "Dean’s List, every term.", "SAT 1510"),
    tutor("Noah Goldberg", "noah.goldberg@onepercentbetter.com", "noah-goldberg", "Brown University", "English", "B.A.", 2020, 7000, "English, History, College Essays", "High School, College", false, false, "Noah edits for voice first. The argument gets sharper once the student sounds like themselves.", "Writing fellow and private essay coach through two admissions cycles.", "Honors in literary arts.", ""),
    tutor("Priya Shah", "priya.shah@onepercentbetter.com", "priya-shah", "Dartmouth College", "Neuroscience", "A.B.", 2024, 8800, "Biology, Chemistry, SAT / ACT Prep", "High School", false, true, "Priya builds sessions around the questions a student is afraid to ask in class.", "Peer tutor in chemistry and a hospital research assistant.", "Cum laude.", "MCAT 520"),
    tutor("Hannah Kim", "hannah.kim@onepercentbetter.com", "hannah-kim", "Stanford University", "Computer Science", "B.S.", 2022, 12500, "Computer Science, Mathematics", "High School, College", true, true, "Hannah teaches algorithms the way a good section leader does: one example, then the student drives.", "Section leader for CS106A and a private tutor for AP Computer Science.", "Tau Beta Pi.", "SAT 1580"),
    tutor("Omar Hassan", "omar.hassan@onepercentbetter.com", "omar-hassan", "Massachusetts Institute of Technology", "Mathematics", "B.S.", 2023, 13000, "Mathematics, Physics", "High School, College, Graduate", true, true, "Omar is exact without being cold. He will not let a student leave a problem they only half-believe.", "Taught multivariable calculus recitations and contest math on weekends.", "Putnam honorable mention.", "SAT Math 800"),
    tutor("Claire Dubois", "claire.dubois@onepercentbetter.com", "claire-dubois", "Duke University", "Public Policy", "B.A.", 2021, 7500, "History, English, College Essays", "High School", true, false, "Claire helps students hold a point of view without losing the evidence underneath it.", "Writing tutor at the Thompson Writing Program and a debate coach.", "Magna cum laude.", ""),
    tutor("Benjamin Adler", "benjamin.adler@onepercentbetter.com", "benjamin-adler", "University of Chicago", "Economics", "B.A.", 2019, 10000, "Economics, Mathematics", "High School, College", false, true, "Benjamin likes graphs that a student can explain out loud, not just reproduce.", "Core economics tutor and a research assistant in labor economics.", "Phi Beta Kappa.", "GRE Quant 169"),
    tutor("Aisha Rahman", "aisha.rahman@onepercentbetter.com", "aisha-rahman", "Northwestern University", "Chemistry", "B.S.", 2024, 7800, "Chemistry, Biology", "High School, College", false, false, "Aisha slows mechanisms down until the arrows mean something.", "Organic chemistry tutor and summer lab mentor.", "Department honors.", "ACT 35"),
  ];

  const createdTutors: Record<string, { id: string; userId: string; rate: number }> = {};
  for (const item of tutors) {
    const user = await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        role: "TUTOR",
        passwordHash,
        timezone: "America/New_York",
        tutorProfile: {
          create: {
            slug: item.slug,
            university: item.university,
            major: item.major,
            degree: item.degree,
            graduationYear: item.year,
            bio: item.bio,
            experience: item.experience,
            education: `${item.degree} in ${item.major}, ${item.university}, ${item.year}`,
            achievements: item.achievements,
            testScores: item.scores,
            subjects: item.subjects,
            gradeLevels: item.grades,
            hourlyRateCents: item.rate,
            status: "APPROVED",
            verified: true,
            active: true,
            featured: item.featured,
            stripeChargesEnabled: item.stripe,
            stripePayoutsEnabled: item.stripe,
            stripeDetailsSubmitted: item.stripe,
            stripeAccountId: item.stripe ? `acct_demo_${item.slug}` : null,
            availabilityNotes: "Weekday evenings and Saturday mornings, Eastern Time.",
            availability: { create: [...weekdayRules, saturday] },
          },
        },
      },
      include: { tutorProfile: true },
    });
    createdTutors[item.slug] = { id: user.tutorProfile!.id, userId: user.id, rate: item.rate };
  }

  await prisma.user.create({
    data: {
      name: "Liam Foster",
      email: "liam.foster@onepercentbetter.com",
      role: "TUTOR",
      passwordHash,
      tutorProfile: {
        create: {
          slug: "liam-foster",
          university: "Cornell University",
          major: "Mechanical Engineering",
          degree: "B.S.",
          graduationYear: 2025,
          bio: "Liam wants to tutor physics and introductory engineering for high school students who like building things and need the math to keep up.",
          experience: "Undergraduate TA for statics. Two summers tutoring algebra.",
          subjects: "Physics, Mathematics",
          gradeLevels: "High School",
          hourlyRateCents: 7000,
          status: "PENDING",
          availabilityNotes: "Evenings after 6pm Eastern.",
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      name: "Grace Liu",
      email: "grace.liu@onepercentbetter.com",
      role: "TUTOR",
      passwordHash,
      tutorProfile: {
        create: {
          slug: "grace-liu",
          university: "Harvard University",
          major: "History",
          degree: "A.B.",
          graduationYear: 2024,
          bio: "Grace coaches document-based essays and AP history for students who know the facts and lose the argument.",
          experience: "Writing center tutor for two years.",
          subjects: "History, College Essays",
          gradeLevels: "High School",
          hourlyRateCents: 8000,
          status: "WAITLISTED",
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      name: "Daniel Cho",
      email: "daniel.cho@onepercentbetter.com",
      role: "TUTOR",
      passwordHash,
      tutorProfile: {
        create: {
          slug: "daniel-cho",
          university: "Yale University",
          major: "Applied Mathematics",
          degree: "B.S.",
          graduationYear: 2025,
          bio: "Daniel tutors contest math and school calculus. He is still gathering enrollment documents.",
          experience: "Math circle instructor.",
          subjects: "Mathematics",
          gradeLevels: "High School",
          hourlyRateCents: 9000,
          status: "MORE_INFO",
          moreInfoRequest: "Please upload proof of enrollment and a short note on the grades you want to teach.",
        },
      },
    },
  });

  const jordan = await student("Jordan Hale", "jordan@onepercentbetter.com", "11th grade isn't a field", "High School", "Brookline High School", "AP Calculus BC and microeconomics, with a calmer approach to timed tests.", "JORDAN26", "danielle@onepercentbetter.com", false);
  const alex = await student("Alex Rivera", "alex@onepercentbetter.com", "", "High School", "Lincoln High School", "Wants a computer science tutor before junior year courses get harder.", "ALEX26", null, false);
  const sam = await student("Sam Patel", "sam@onepercentbetter.com", "", "Middle School", "Pierce School", "Algebra foundations and study habits.", "SAM26", "anita@onepercentbetter.com", true);
  const riley = await student("Riley Chen", "riley@onepercentbetter.com", "", "High School", "North High School", "College essays that sound like Riley, not a template.", "RILEY26", null, false);

  const danielle = await prisma.user.create({
    data: { name: "Danielle Hale", email: "danielle@onepercentbetter.com", role: "PARENT", passwordHash, parentProfile: { create: {} }, timezone: "America/New_York" },
    include: { parentProfile: true },
  });
  const anita = await prisma.user.create({
    data: { name: "Anita Patel", email: "anita@onepercentbetter.com", role: "PARENT", passwordHash, parentProfile: { create: {} }, timezone: "America/Chicago" },
    include: { parentProfile: true },
  });
  await prisma.studentProfile.update({ where: { id: jordan.id }, data: { parentId: danielle.parentProfile!.id } });
  await prisma.studentProfile.update({ where: { id: sam.id }, data: { parentId: anita.parentProfile!.id } });

  // Referral demo: Jordan has $15 credit; Alex signed up with Jordan’s code (reward on Alex’s first paid session).
  await prisma.studentProfile.update({ where: { id: jordan.id }, data: { creditBalanceCents: 1500 } });
  await prisma.studentProfile.update({ where: { id: alex.id }, data: { referredByCode: "JORDAN26" } });
  await prisma.referral.create({
    data: { code: "JORDAN26", referrerUserId: jordan.userId, referredUserId: alex.userId, status: "SIGNED_UP" },
  });
  await prisma.creditLedger.create({
    data: {
      studentId: jordan.id,
      deltaCents: 1500,
      reason: "SEED",
      note: "Demo balance for local checkout tests",
    },
  });

  await prisma.assignment.createMany({
    data: [
      { studentId: jordan.id, tutorId: createdTutors["maya-chen"].id, status: "ACTIVE" },
      { studentId: jordan.id, tutorId: createdTutors["omar-hassan"].id, status: "ACTIVE" },
      { studentId: sam.id, tutorId: createdTutors["sofia-alvarez"].id, status: "ACTIVE" },
    ],
  });

  await prisma.tutoringRequest.create({
    data: {
      studentId: riley.id,
      tutorId: createdTutors["noah-goldberg"].id,
      message: "We spoke briefly and I want help with two college essays before November deadlines.",
      goals: "Essays with a real voice.",
      status: "PENDING",
    },
  });

  await booking({
    studentId: jordan.id,
    tutorId: createdTutors["maya-chen"].id,
    type: "CONSULTATION",
    status: "COMPLETED",
    startsAt: "2026-09-08T22:00:00.000Z",
    minutes: 15,
    rate: 0,
  });
  const past = await booking({
    studentId: jordan.id,
    tutorId: createdTutors["maya-chen"].id,
    type: "SESSION",
    status: "COMPLETED",
    startsAt: "2026-09-18T20:00:00.000Z",
    minutes: 60,
    rate: 9500,
  });
  await booking({
    studentId: jordan.id,
    tutorId: createdTutors["maya-chen"].id,
    type: "SESSION",
    status: "CONFIRMED",
    startsAt: "2026-10-16T20:00:00.000Z",
    minutes: 60,
    rate: 9500,
  });
  await booking({
    studentId: alex.id,
    tutorId: createdTutors["hannah-kim"].id,
    type: "CONSULTATION",
    status: "CONFIRMED",
    startsAt: "2026-10-18T19:00:00.000Z",
    minutes: 15,
    rate: 0,
  });
  await booking({
    studentId: alex.id,
    tutorId: createdTutors["hannah-kim"].id,
    type: "SESSION",
    status: "COMPLETED",
    startsAt: "2026-09-05T19:00:00.000Z",
    minutes: 60,
    rate: 12500,
  });
  await booking({
    studentId: sam.id,
    tutorId: createdTutors["sofia-alvarez"].id,
    type: "SESSION",
    status: "COMPLETED",
    startsAt: "2026-08-12T18:00:00.000Z",
    minutes: 60,
    rate: 9000,
  });

  const history: Array<[string, string, string, number]> = [
    ["2026-05-06T20:00:00.000Z", jordan.id, "maya-chen", 9500],
    ["2026-06-10T20:00:00.000Z", jordan.id, "omar-hassan", 13000],
    ["2026-06-24T20:00:00.000Z", jordan.id, "maya-chen", 9500],
    ["2026-07-08T18:00:00.000Z", sam.id, "sofia-alvarez", 9000],
    ["2026-07-22T20:00:00.000Z", jordan.id, "omar-hassan", 13000],
    ["2026-08-05T20:00:00.000Z", jordan.id, "maya-chen", 9500],
    ["2026-10-02T20:00:00.000Z", jordan.id, "omar-hassan", 13000],
  ];
  for (const [startsAt, studentId, slug, rate] of history) {
    await booking({ studentId, tutorId: createdTutors[slug].id, type: "SESSION", status: "COMPLETED", startsAt, minutes: 60, rate });
  }

  await prisma.sessionReport.create({
    data: {
      bookingId: past.id,
      tutorId: createdTutors["maya-chen"].id,
      topics: "Related rates and the chain rule on three AP-style problems.",
      performance: "Jordan set the problems up correctly and lost time translating units.",
      improvements: "Write the units beside every derivative before simplifying.",
      recommendations: "Ten minutes of mixed related-rates problems before Thursday.",
    },
  });
  const jordanUser = await prisma.user.findUniqueOrThrow({ where: { email: "jordan@onepercentbetter.com" } });
  // No seeded/demo reviews — homepage and profiles only show real student feedback.
  await prisma.progressNote.create({
    data: {
      studentId: jordan.id,
      tutorId: createdTutors["maya-chen"].id,
      goal: "AP Calculus BC practice sets under timed conditions",
      note: "Accuracy is ahead of speed. The next month is about cleaner setup, not new content.",
      metricLabel: "Timed set accuracy",
      metricValue: "8/10",
    },
  });
  await prisma.homework.create({
    data: {
      tutorId: createdTutors["sofia-alvarez"].id,
      studentId: sam.id,
      title: "Linear equations, set three",
      description: "Finish problems 1 through 8. Show the check for the last two.",
      subject: "Mathematics",
      dueAt: new Date("2026-10-18T23:00:00.000Z"),
      materialText: "Remember: whatever you do to one side, do to the other.",
      status: "ASSIGNED",
    },
  });
  await prisma.homework.create({
    data: {
      tutorId: createdTutors["maya-chen"].id,
      studentId: jordan.id,
      title: "Related rates rewrite",
      description: "Rewrite two problems from last session with units labeled.",
      subject: "Mathematics",
      status: "REVIEWED",
      submissionText: "I redid the ladder problem and the cone problem with units on every line.",
      feedback: "The ladder problem is clean. On the cone, name the rate you were given before you differentiate.",
      grade: "Strong",
      submittedAt: new Date("2026-09-20T15:00:00.000Z"),
      reviewedAt: new Date("2026-09-21T15:00:00.000Z"),
    },
  });
  await prisma.homework.create({
    data: {
      tutorId: createdTutors["maya-chen"].id,
      studentId: jordan.id,
      title: "Chain rule warm-up",
      description: "Complete the six warm-up derivatives. Circle any step where the inner function is unclear.",
      subject: "Mathematics",
      dueAt: new Date("2026-10-15T23:00:00.000Z"),
      materialText: "Focus on u-substitution language: name the inner function before you differentiate.",
      status: "ASSIGNED",
    },
  });
  await prisma.homework.create({
    data: {
      tutorId: createdTutors["omar-hassan"].id,
      studentId: jordan.id,
      title: "Multivariable sketch set",
      description: "Sketch level curves for problems 2, 4, and 5. Bring one question you want to unpack live.",
      subject: "Mathematics",
      dueAt: new Date("2026-10-20T23:00:00.000Z"),
      materialText: "Use the same scale on both axes so the curves stay comparable.",
      status: "ASSIGNED",
    },
  });
  await prisma.homework.create({
    data: {
      tutorId: createdTutors["maya-chen"].id,
      studentId: jordan.id,
      title: "Microeconomics graph check",
      description: "Redraw the supply-and-demand shift from Tuesday and label the consumer surplus change.",
      subject: "Economics",
      dueAt: new Date("2026-10-14T23:00:00.000Z"),
      status: "SUBMITTED",
      submissionText: "I redrew both equilibria and shaded the surplus triangle. Still unsure about the tax wedge label.",
      submittedAt: new Date("2026-10-11T18:30:00.000Z"),
    },
  });
  await prisma.homework.create({
    data: {
      tutorId: createdTutors["omar-hassan"].id,
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
  });

  const mayaUser = await prisma.user.findUniqueOrThrow({ where: { email: "maya.chen@onepercentbetter.com" } });
  await prisma.message.createMany({
    data: [
      { senderId: mayaUser.id, recipientId: jordanUser.id, body: "Bring the related-rates worksheet. We’ll start with the one that felt slippery.", createdAt: new Date("2026-10-10T18:00:00.000Z") },
      { senderId: jordanUser.id, recipientId: mayaUser.id, body: "I will. I also circled the cone problem.", createdAt: new Date("2026-10-10T19:00:00.000Z") },
    ],
  });
  await prisma.notification.create({
    data: {
      userId: jordanUser.id,
      type: "BOOKING",
      title: "Consultation confirmed",
      body: "Your earlier consultation with Maya Chen is on your calendar.",
      href: "/dashboard/student/calendar",
    },
  });
  await prisma.contactMessage.create({
    data: {
      name: "Elena Vasquez",
      email: "elena@example.com",
      topic: "Booking help",
      message: "We booked a consultation and want to be sure the Zoom link will show on the parent account too.",
    },
  });

  console.log("Seeded 1% Better Tutoring.");
  console.log("Password for every demo account: OnePercent!2026");
}

function tutor(
  name: string,
  email: string,
  slug: string,
  university: string,
  major: string,
  degree: string,
  year: number,
  rate: number,
  subjects: string,
  grades: string,
  featured: boolean,
  stripe: boolean,
  bio: string,
  experience: string,
  achievements: string,
  scores: string,
) {
  return { name, email, slug, university, major, degree, year, rate, subjects, grades, featured, stripe, bio, experience, achievements, scores };
}

async function student(
  name: string,
  email: string,
  _unused: string,
  gradeLevel: string,
  school: string,
  goals: string,
  referralCode: string,
  guardianEmail: string | null,
  isMinor: boolean,
) {
  const studentPortraits: Record<string, string> = {
    "jordan@onepercentbetter.com": "/images/portrait-jordan.jpg",
    "alex@onepercentbetter.com": "/images/portrait-alex.jpg",
    "sam@onepercentbetter.com": "/images/portrait-sam.jpg",
    "riley@onepercentbetter.com": "/images/portrait-riley.jpg",
  };
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: "STUDENT",
      passwordHash,
      timezone: "America/New_York",
      imageUrl: studentPortraits[email] || null,
      studentProfile: { create: { gradeLevel, school, goals, referralCode, guardianEmail, isMinor, subjectsNeeded: "Mathematics" } },
    },
    include: { studentProfile: true },
  });
  return user.studentProfile!;
}

async function booking(input: {
  studentId: string;
  tutorId: string;
  type: string;
  status: string;
  startsAt: string;
  minutes: number;
  rate: number;
}) {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + input.minutes * 60 * 1000);
  const price = input.type === "SESSION" ? input.rate : 0;
  const split = splitAmount(price, input.type === "SESSION" ? 30 : 0);
  const created = await prisma.booking.create({
    data: {
      studentId: input.studentId,
      tutorId: input.tutorId,
      type: input.type,
      status: input.status,
      startsAt,
      endsAt,
      timezone: "America/New_York",
      durationMin: input.minutes,
      priceCents: price,
      tutorShareCents: split.tutorShareCents,
      platformShareCents: split.platformShareCents,
      commissionPercent: input.type === "SESSION" ? 30 : 0,
      zoomJoinUrl: input.status === "CONFIRMED" ? null : null,
    },
  });
  if (input.type === "SESSION" && input.status !== "CANCELLED") {
    const fee = estimateProcessingFee(price);
    await prisma.transaction.create({
      data: {
        bookingId: created.id,
        amountCents: price,
        tutorShareCents: split.tutorShareCents,
        platformShareCents: split.platformShareCents,
        stripeFeeCents: fee,
        netPlatformCents: netPlatformEarnings(split.platformShareCents, fee),
        status: "SUCCEEDED",
        createdAt: startsAt,
      },
    });
  }
  return created;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
