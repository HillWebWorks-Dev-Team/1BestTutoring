import { Notice } from "@/components/ui";
import { live } from "@/lib/live";
import { createAssignment, endAssignment, resolveRequest } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function MatchingPage({ searchParams }: { searchParams: Promise<{ error?: string; assigned?: string }> }) {
  const query = await searchParams;
  const db = await live();
  const [students, tutors, assignments, requests] = await Promise.all([
    db.studentProfile.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
    db.tutorProfile.findMany({ where: { status: "APPROVED" }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
    db.assignment.findMany({ where: { status: "ACTIVE" }, include: { student: { include: { user: true } }, tutor: { include: { user: true } } } }),
    db.tutoringRequest.findMany({ where: { status: "PENDING" }, include: { student: { include: { user: true } }, tutor: { include: { user: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-5xl">Matching</h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">Students can request a tutor. Only this desk can create the relationship. Tutors cannot assign themselves.</p>
      <div className="my-4"><Notice error={query.error} success={query.assigned ? "Assignment saved." : undefined} /></div>
      <form action={createAssignment} className="card grid gap-3 p-5 md:grid-cols-2">
        <select className="field" name="studentId" required>
          {students.map((student) => <option key={student.id} value={student.id}>{student.user.name}</option>)}
        </select>
        <select className="field" name="tutorId" required>
          {tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.user.name}</option>)}
        </select>
        <textarea className="field md:col-span-2" name="notes" placeholder="Why this match" />
        <button className="btn btn-primary w-fit" type="submit">Assign</button>
      </form>
      <h2 className="mb-3 mt-8 font-serif text-3xl">Requests</h2>
      <div className="grid gap-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-3xl border border-line p-4">
            <p className="font-medium">{request.student.user.name} → {request.tutor.user.name}</p>
            <p className="mt-2 text-sm text-mute">{request.message}</p>
            <div className="mt-3 flex gap-2">
              <form action={resolveRequest}><input type="hidden" name="requestId" value={request.id} /><button className="btn btn-primary" name="decision" value="approve" type="submit">Assign</button></form>
              <form action={resolveRequest}><input type="hidden" name="requestId" value={request.id} /><button className="btn btn-line" name="decision" value="decline" type="submit">Decline</button></form>
            </div>
          </article>
        ))}
        {!requests.length ? <p className="text-sm text-mute">No open requests.</p> : null}
      </div>
      <h2 className="mb-3 mt-8 font-serif text-3xl">Active connections</h2>
      <div className="grid gap-2">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-sm">
            <span>{assignment.student.user.name} · {assignment.tutor.user.name}</span>
            <form action={endAssignment}><input type="hidden" name="assignmentId" value={assignment.id} /><button className="underline" type="submit">End</button></form>
          </div>
        ))}
      </div>
    </div>
  );
}
