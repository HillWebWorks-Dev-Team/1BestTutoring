import Link from "next/link";
import { Notice } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { linkChild } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function ParentHome({ searchParams }: { searchParams: Promise<{ error?: string; linked?: string; requested?: string; booked?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const students = await db.studentProfile.findMany({
    where: { parentId: user.parentProfile?.id || "" },
    include: { user: true, assignments: { where: { status: "ACTIVE" }, include: { tutor: { include: { user: true } } } } },
  });
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Family desk</h1>
      <div className="my-4">
        <Notice
          error={query.error}
          success={query.linked ? "Student linked." : query.requested ? "Request sent to the matching desk." : query.booked ? "Booking confirmed." : undefined}
        />
      </div>
      <div className="grid gap-4">
        {students.map((student) => (
          <article key={student.id} className="card p-5">
            <h2 className="font-serif text-3xl">{student.user.name}</h2>
            <p className="text-sm text-mute">{student.gradeLevel} · {student.goals || "No goals yet"}</p>
            <ul className="mt-3 text-sm">
              {student.assignments.map((assignment) => (
                <li key={assignment.id}>{assignment.tutor.user.name}</li>
              ))}
              {!student.assignments.length ? <li className="text-mute">No tutor assigned yet. You can still book a consultation.</li> : null}
            </ul>
            <Link className="btn btn-line mt-4" href={`/tutors?studentId=${student.id}`}>Browse tutors</Link>
          </article>
        ))}
      </div>
      <form action={linkChild} className="card mt-6 grid gap-3 p-5">
        <p className="font-serif text-2xl">Link a student</p>
        <p className="text-sm text-mute">The student account must list this email as the guardian email.</p>
        <input className="field" type="email" name="email" placeholder="Student email" required />
        <button className="btn btn-primary w-fit" type="submit">Link</button>
      </form>
    </div>
  );
}
