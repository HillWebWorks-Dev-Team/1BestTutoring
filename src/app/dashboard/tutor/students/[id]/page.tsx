import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { canViewStudentData } from "@/lib/access";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { saveProgress } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function StudentFile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  const db = await live();
  const student = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      parent: { include: { user: true } },
      assignments: { where: { tutorId: user.tutorProfile.id } },
      homework: { where: { tutorId: user.tutorProfile.id }, orderBy: { createdAt: "desc" } },
      progress: { where: { tutorId: user.tutorProfile.id }, orderBy: { createdAt: "desc" } },
      bookings: { where: { tutorId: user.tutorProfile.id }, include: { report: true }, orderBy: { startsAt: "desc" }, take: 8 },
    },
  });
  const allowed = student && canViewStudentData({
    viewerRole: "TUTOR",
    viewerId: user.id,
    studentUserId: student.userId,
    assignedTutorUserIds: student.assignments.some((item) => item.tutorId === user.tutorProfile?.id) ? [user.id] : [],
  });
  if (!student || !allowed) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <p className="kicker">{student.gradeLevel} · {student.school || "School not listed"}</p>
      <h1 className="mt-2 font-serif text-5xl">{student.user.name}</h1>
      <p className="mt-3 max-w-2xl text-mute">{student.goals || "No goals written yet."}</p>
      {student.isMinor ? <p className="mt-3 text-sm text-slate">Minor account{student.parent ? ` · guardian ${student.parent.user.name}` : student.guardianEmail ? ` · guardian email ${student.guardianEmail}` : ""}.</p> : null}
      <div className="my-4"><Notice error={query.error} success={query.saved ? "Note saved." : undefined} /></div>
      <form action={saveProgress} className="card mt-6 grid gap-3 p-5">
        <p className="font-serif text-2xl">Add a progress note</p>
        <input type="hidden" name="studentId" value={student.id} />
        <input className="field" name="goal" placeholder="Goal" />
        <textarea className="field min-h-20" name="note" placeholder="What improved, and what’s next" />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" name="metricLabel" placeholder="Metric, optional" />
          <input className="field" name="metricValue" placeholder="Value" />
        </div>
        <button className="btn btn-primary w-fit" type="submit">Save note</button>
      </form>
      <div className="mt-6 grid gap-3">
        {student.progress.map((note) => (
          <article key={note.id} className="rounded-2xl border border-line p-4">
            <p className="text-xs text-mute">{formatWhen(note.createdAt, user.timezone, false)}</p>
            <h2 className="font-serif text-2xl">{note.goal}</h2>
            <p className="text-sm">{note.note}</p>
          </article>
        ))}
        {student.bookings.map((booking) => (
          <p key={booking.id} className="text-sm text-mute">{formatWhen(booking.startsAt, user.timezone)} · {booking.type.toLowerCase()} · {booking.status.toLowerCase()}{booking.report ? " · report filed" : ""}</p>
        ))}
      </div>
    </div>
  );
}
