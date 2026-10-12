import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ParentProgress() {
  const user = await requireUser();
  const db = await live();
  const students = await db.studentProfile.findMany({ where: { parentId: user.parentProfile?.id || "" }, select: { id: true, user: { select: { name: true } } } });
  const notes = await db.progressNote.findMany({
    where: { studentId: { in: students.map((student) => student.id) } },
    include: { tutor: { include: { user: true } }, student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  const reports = await db.sessionReport.findMany({
    where: { booking: { studentId: { in: students.map((student) => student.id) } } },
    include: { tutor: { include: { user: true } }, booking: { include: { student: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Progress</h1>
      <div className="mt-6 grid gap-4">
        {notes.map((note) => (
          <article key={note.id} className="card p-5">
            <p className="kicker">{note.student.user.name} · {note.tutor.user.name}</p>
            <h2 className="mt-2 font-serif text-3xl">{note.goal}</h2>
            <p className="mt-2 text-sm">{note.note}</p>
            <p className="mt-2 text-xs text-mute">{formatWhen(note.createdAt, user.timezone, false)}</p>
          </article>
        ))}
        {reports.map((report) => (
          <article key={report.id} className="rounded-3xl border border-line p-5">
            <p className="kicker">{report.booking.student.user.name} · session notes</p>
            <h2 className="mt-2 font-serif text-2xl">{report.topics}</h2>
            <p className="mt-2 text-sm text-mute">{report.performance}</p>
            <p className="mt-2 text-sm">{report.recommendations}</p>
          </article>
        ))}
        {!notes.length && !reports.length ? <p className="text-sm text-mute">Notes appear after a tutor records them.</p> : null}
      </div>
    </div>
  );
}
