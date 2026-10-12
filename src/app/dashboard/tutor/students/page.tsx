import Link from "next/link";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TutorStudents() {
  const user = await requireUser();
  if (user.tutorProfile?.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const db = await live();
  const assignments = await db.assignment.findMany({
    where: { tutorId: user.tutorProfile.id, status: "ACTIVE" },
    include: { student: { include: { user: true } } },
  });
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Students</h1>
      <div className="mt-6 grid gap-3">
        {assignments.map((assignment) => (
          <Link key={assignment.id} href={`/dashboard/tutor/students/${assignment.studentId}`} className="card block p-5">
            <span className="font-serif text-3xl">{assignment.student.user.name}</span>
            <span className="mt-1 block text-sm text-mute">{assignment.student.gradeLevel} · {assignment.student.goals || "No goals yet"}</span>
          </Link>
        ))}
        {!assignments.length ? <p className="text-sm text-mute">Students appear here only after an admin assigns them.</p> : null}
      </div>
    </div>
  );
}
