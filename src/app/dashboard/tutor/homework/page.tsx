import { redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { createHomework, reviewHomework } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function TutorHomework({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; reviewed?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  if (user.tutorProfile?.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const db = await live();
  const [students, items] = await Promise.all([
    db.assignment.findMany({ where: { tutorId: user.tutorProfile.id, status: "ACTIVE" }, include: { student: { include: { user: true } } } }),
    db.homework.findMany({ where: { tutorId: user.tutorProfile.id }, include: { student: { include: { user: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Homework</h1>
      <div className="my-4"><Notice error={query.error} success={query.saved ? "Assignment sent." : query.reviewed ? "Feedback saved." : undefined} /></div>
      <form action={createHomework} className="card grid gap-3 p-5">
        <p className="font-serif text-2xl">New assignment</p>
        <select className="field" name="studentId" required>
          {students.map((item) => <option key={item.studentId} value={item.studentId}>{item.student.user.name}</option>)}
        </select>
        <input className="field" name="title" placeholder="Title" required />
        <input className="field" name="subject" placeholder="Subject" />
        <textarea className="field min-h-20" name="description" placeholder="Instructions" required />
        <textarea className="field min-h-16" name="materialText" placeholder="Worksheet or notes to paste" />
        <input className="field" type="datetime-local" name="dueAt" />
        <button className="btn btn-primary w-fit" type="submit">Assign</button>
      </form>
      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line p-5">
            <p className="kicker">{item.student.user.name} · {item.status.toLowerCase()}</p>
            <h2 className="font-serif text-3xl">{item.title}</h2>
            <p className="mt-2 text-sm text-mute">{item.description}</p>
            {item.dueAt ? <p className="mt-2 text-xs text-mute">Due {formatWhen(item.dueAt, user.timezone)}</p> : null}
            {item.submissionText ? <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-mist p-3 text-sm">{item.submissionText}</p> : null}
            <form action={reviewHomework} className="mt-3 grid gap-2">
              <input type="hidden" name="homeworkId" value={item.id} />
              <textarea className="field" name="feedback" placeholder="Feedback" defaultValue={item.feedback} />
              <input className="field" name="grade" placeholder="Grade or score" defaultValue={item.grade || ""} />
              <button className="btn btn-line w-fit" type="submit">Save feedback</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
