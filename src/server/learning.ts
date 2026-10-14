"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canMessagePair } from "@/lib/access";
import { live } from "@/lib/live";
import { notify } from "@/lib/notify";
import { requireUser } from "@/lib/session";

async function activeAssignment(userId: string, otherUserId: string) {
  const db = await live();
  const users = await db.user.findMany({
    where: { id: { in: [userId, otherUserId] } },
    include: { studentProfile: true, tutorProfile: true },
  });
  const student = users.find((person) => person.studentProfile);
  const tutor = users.find((person) => person.tutorProfile);
  if (!student?.studentProfile || !tutor?.tutorProfile) return null;
  return db.assignment.findUnique({
    where: { studentId_tutorId: { studentId: student.studentProfile.id, tutorId: tutor.tutorProfile.id } },
  });
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const recipientId = String(formData.get("recipientId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!recipientId || body.length < 1) return;
  const assignment = await activeAssignment(user.id, recipientId);
  if (!canMessagePair(assignment?.status === "ACTIVE")) {
    redirect("/dashboard?error=Messaging opens after a tutor is officially assigned.");
  }
  const db = await live();
  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) redirect("/dashboard?error=Files must be 4MB or smaller.");
    const doc = await db.document.create({
      data: {
        userId: user.id,
        kind: "ATTACHMENT",
        fileName: file.name.slice(0, 140),
        mimeType: file.type || "application/octet-stream",
        data: Buffer.from(await file.arrayBuffer()),
      },
    });
    attachmentUrl = `/api/documents/${doc.id}`;
    attachmentName = doc.fileName;
  }
  await db.message.create({
    data: { senderId: user.id, recipientId, body, attachmentUrl, attachmentName },
  });
  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (recipient) {
    const href =
      recipient.role === "TUTOR"
        ? `/dashboard/tutor/messages/${user.id}`
        : `/dashboard/student/messages/${user.id}`;
    await notify({
      userId: recipient.id,
      email: recipient.email,
      type: "MESSAGE",
      title: `New message from ${user.name}`,
      body: body.slice(0, 180),
      href,
    });
  }
  revalidatePath("/dashboard");
}

export async function markConversationUnread(formData: FormData) {
  const user = await requireUser();
  const otherUserId = String(formData.get("otherUserId") || "");
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  if (!otherUserId) redirect(returnTo);

  const assignment = await activeAssignment(user.id, otherUserId);
  if (!assignment) redirect(returnTo);

  const db = await live();
  const latestIncoming = await db.message.findFirst({
    where: { recipientId: user.id, senderId: otherUserId },
    orderBy: { createdAt: "desc" },
  });
  if (latestIncoming) {
    await db.message.update({
      where: { id: latestIncoming.id },
      data: { readAt: null },
    });
  }

  revalidatePath("/dashboard/student/messages");
  revalidatePath("/dashboard/tutor/messages");
  redirect(returnTo);
}

export async function toggleConversationPin(formData: FormData) {
  const user = await requireUser();
  const otherUserId = String(formData.get("otherUserId") || "");
  const returnTo = String(formData.get("returnTo") || "/dashboard");
  if (!otherUserId) redirect(returnTo);

  const assignment = await activeAssignment(user.id, otherUserId);
  if (!assignment) redirect(returnTo);

  const db = await live();
  const existing = await db.pinnedConversation.findUnique({
    where: { userId_otherUserId: { userId: user.id, otherUserId } },
  });
  if (existing) {
    await db.pinnedConversation.delete({ where: { id: existing.id } });
  } else {
    await db.pinnedConversation.create({
      data: { userId: user.id, otherUserId },
    });
  }

  revalidatePath("/dashboard/student/messages");
  revalidatePath("/dashboard/tutor/messages");
  redirect(returnTo);
}

export async function createHomework(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile || user.tutorProfile.status !== "APPROVED") redirect("/dashboard/tutor");
  const studentId = String(formData.get("studentId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!studentId || title.length < 2 || description.length < 2) redirect("/dashboard/tutor/homework?error=Add a title and instructions.");
  const db = await live();
  const assignment = await db.assignment.findUnique({
    where: { studentId_tutorId: { studentId, tutorId: user.tutorProfile.id } },
    include: { student: { include: { user: true } } },
  });
  if (assignment?.status !== "ACTIVE") redirect("/dashboard/tutor/homework?error=That student is not assigned to you.");
  const dueRaw = String(formData.get("dueAt") || "");
  await db.homework.create({
    data: {
      tutorId: user.tutorProfile.id,
      studentId,
      title,
      description,
      subject: String(formData.get("subject") || ""),
      materialText: String(formData.get("materialText") || ""),
      dueAt: dueRaw ? new Date(dueRaw) : null,
    },
  });
  await notify({
    userId: assignment.student.userId,
    email: assignment.student.user.email,
    type: "HOMEWORK",
    title: `New homework: ${title}`,
    body: description.slice(0, 180),
    href: "/dashboard/student/homework",
  });
  revalidatePath("/dashboard/tutor/homework");
  redirect("/dashboard/tutor/homework?saved=1");
}

export async function submitHomework(formData: FormData) {
  const user = await requireUser();
  if (!user.studentProfile) redirect("/dashboard");
  const db = await live();
  const homework = await db.homework.findUnique({
    where: { id: String(formData.get("homeworkId")) },
    include: { tutor: { include: { user: true } } },
  });
  if (!homework || homework.studentId !== user.studentProfile.id) redirect("/dashboard/student/homework");
  const submissionText = String(formData.get("submissionText") || "").trim();
  if (submissionText.length < 2) redirect("/dashboard/student/homework?error=Add your work before submitting.");
  await db.homework.update({
    where: { id: homework.id },
    data: { submissionText, status: "SUBMITTED", submittedAt: new Date() },
  });
  await notify({
    userId: homework.tutor.userId,
    email: homework.tutor.user.email,
    type: "HOMEWORK",
    title: `${user.name} submitted ${homework.title}`,
    body: "Review it from your homework desk.",
    href: "/dashboard/tutor/homework",
  });
  redirect("/dashboard/student/homework?submitted=1");
}

export async function reviewHomework(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  const db = await live();
  const homework = await db.homework.findUnique({
    where: { id: String(formData.get("homeworkId")) },
    include: { student: { include: { user: true } } },
  });
  if (!homework || homework.tutorId !== user.tutorProfile.id) redirect("/dashboard/tutor/homework");
  await db.homework.update({
    where: { id: homework.id },
    data: {
      feedback: String(formData.get("feedback") || ""),
      grade: String(formData.get("grade") || "") || null,
      status: "REVIEWED",
      reviewedAt: new Date(),
    },
  });
  await notify({
    userId: homework.student.userId,
    email: homework.student.user.email,
    type: "HOMEWORK",
    title: `Feedback on ${homework.title}`,
    body: String(formData.get("feedback") || "Your tutor left feedback."),
    href: "/dashboard/student/homework",
  });
  redirect("/dashboard/tutor/homework?reviewed=1");
}

export async function saveReport(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  const db = await live();
  const booking = await db.booking.findUnique({
    where: { id: String(formData.get("bookingId")) },
    include: { student: { include: { user: true, parent: { include: { user: true } } } } },
  });
  if (!booking || booking.tutorId !== user.tutorProfile.id) redirect("/dashboard/tutor/calendar");
  const topics = String(formData.get("topics") || "").trim();
  const performance = String(formData.get("performance") || "").trim();
  const improvements = String(formData.get("improvements") || "").trim();
  const recommendations = String(formData.get("recommendations") || "").trim();
  if (!topics || !performance) redirect("/dashboard/tutor/calendar?error=Add the topics you covered and how the student did.");
  await db.sessionReport.upsert({
    where: { bookingId: booking.id },
    update: { topics, performance, improvements, recommendations },
    create: { bookingId: booking.id, tutorId: user.tutorProfile.id, topics, performance, improvements, recommendations },
  });
  await db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } });
  const recipients = [booking.student.user, booking.student.parent?.user].filter((person): person is NonNullable<typeof person> => Boolean(person));
  await Promise.all(
    recipients.map((person) =>
      notify({
        userId: person.id,
        email: person.email,
        type: "REPORT",
        title: `Session notes from ${user.name}`,
        body: topics.slice(0, 180),
        href: person.role === "PARENT" ? "/dashboard/parent/progress" : "/dashboard/student/progress",
      }),
    ),
  );
  if (booking.type === "SESSION") {
    await notify({
      userId: booking.student.userId,
      email: booking.student.user.email,
      type: "REVIEW",
      title: "Share feedback on this session",
      body: `How was tutoring with ${user.name}? A short review helps the next family choose.`,
      href: "/dashboard/student?review=1",
      dedupeKey: `review-prompt:${booking.id}`,
    });
  }
  redirect("/dashboard/tutor/calendar?reported=1");
}

export async function saveProgress(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  const studentId = String(formData.get("studentId") || "");
  const db = await live();
  const assignment = await db.assignment.findUnique({
    where: { studentId_tutorId: { studentId, tutorId: user.tutorProfile.id } },
  });
  if (assignment?.status !== "ACTIVE") redirect("/dashboard/tutor/students");
  const goal = String(formData.get("goal") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!goal || !note) redirect(`/dashboard/tutor/students/${studentId}?error=Add a goal and a note.`);
  await db.progressNote.create({
    data: {
      studentId,
      tutorId: user.tutorProfile.id,
      goal,
      note,
      metricLabel: String(formData.get("metricLabel") || "") || null,
      metricValue: String(formData.get("metricValue") || "") || null,
    },
  });
  redirect(`/dashboard/tutor/students/${studentId}?saved=1`);
}

export async function saveReview(formData: FormData) {
  const user = await requireUser();
  if (!user.studentProfile) redirect("/dashboard");
  const db = await live();
  const booking = await db.booking.findUnique({
    where: { id: String(formData.get("bookingId")) },
    include: { tutor: { include: { user: true } }, review: true },
  });
  if (!booking || booking.studentId !== user.studentProfile.id || booking.status !== "COMPLETED" || booking.review) {
    redirect("/dashboard/student/calendar?error=Reviews are available after a completed session.");
  }
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") || "").trim();
  if (rating < 1 || rating > 5 || comment.length < 8) {
    redirect("/dashboard/student/calendar?error=Add a rating and a short comment.");
  }
  await db.review.create({
    data: {
      bookingId: booking.id,
      tutorId: booking.tutorId,
      authorId: user.id,
      rating,
      comment,
      verified: true,
      published: true,
    },
  });
  const { revalidatePath, revalidateTag } = await import("next/cache");
  revalidateTag("home");
  revalidatePath(`/tutors/${booking.tutor.slug}`);
  revalidatePath("/tutors");
  redirect(`/tutors/${booking.tutor.slug}?reviewed=1`);
}

export async function updateStudentSettings(formData: FormData) {
  const user = await requireUser();
  const db = await live();
  await db.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") || user.name),
      phone: String(formData.get("phone") || "") || null,
      timezone: String(formData.get("timezone") || user.timezone),
    },
  });
  if (user.studentProfile) {
    await db.studentProfile.update({
      where: { id: user.studentProfile.id },
      data: {
        gradeLevel: String(formData.get("gradeLevel") || user.studentProfile.gradeLevel || ""),
        school: String(formData.get("school") || ""),
        goals: String(formData.get("goals") || ""),
        subjectsNeeded: formData.getAll("subjects").map(String).join(", "),
        guardianEmail: String(formData.get("guardianEmail") || "").toLowerCase() || null,
        isMinor: formData.get("isMinor") === "on" || String(formData.get("gradeLevel")) === "Middle School",
      },
    });
  }
  redirect("/dashboard/student/settings?saved=1");
}

export async function linkChild(formData: FormData) {
  const user = await requireUser();
  if (!user.parentProfile) redirect("/dashboard");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const db = await live();
  const studentUser = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  if (!studentUser?.studentProfile) redirect("/dashboard/parent?error=No student account uses that email.");
  const guardian = studentUser.studentProfile.guardianEmail?.toLowerCase();
  if (guardian !== user.email) {
    redirect("/dashboard/parent?error=Ask the student to list your email as their guardian, or contact support to link the accounts.");
  }
  await db.studentProfile.update({
    where: { id: studentUser.studentProfile.id },
    data: { parentId: user.parentProfile.id },
  });
  redirect("/dashboard/parent?linked=1");
}

export async function updateParentSettings(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "PARENT" || !user.parentProfile) redirect("/dashboard");
  const db = await live();
  await db.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") || user.name),
      phone: String(formData.get("phone") || "") || null,
      timezone: String(formData.get("timezone") || user.timezone),
    },
  });
  redirect("/dashboard/parent/settings?saved=1");
}

export async function updateChildGoals(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "PARENT" || !user.parentProfile) redirect("/dashboard");
  const studentId = String(formData.get("studentId") || "");
  const linked = user.parentProfile.students.some((student) => student.id === studentId);
  if (!linked) redirect("/dashboard/parent/progress?error=That student is not linked to your account.");
  const db = await live();
  await db.studentProfile.update({
    where: { id: studentId },
    data: { goals: String(formData.get("goals") || "").trim() },
  });
  redirect(`/dashboard/parent/progress?studentId=${encodeURIComponent(studentId)}&saved=1`);
}

export async function markNotificationsRead() {
  const user = await requireUser();
  const db = await live();
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
}
