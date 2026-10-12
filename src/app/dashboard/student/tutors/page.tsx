import Link from "next/link";
import { UniversityMark } from "@/components/brand";
import { Empty } from "@/components/ui";
import { hourly } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MyTutorsPage() {
  const user = await requireUser();
  const db = await live();
  const assignments = await db.assignment.findMany({
    where: { studentId: user.studentProfile?.id || "" },
    include: { tutor: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  const active = assignments.filter((item) => item.status === "ACTIVE");
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">My tutors</h1>
      {active.length ? (
        <div className="mt-6 grid gap-4">
          {active.map((assignment) => (
            <article key={assignment.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 className="font-serif text-3xl">{assignment.tutor.user.name}</h2>
                <div className="mt-2"><UniversityMark university={assignment.tutor.university} /></div>
                <p className="mt-2 text-sm text-mute">{hourly(assignment.tutor.hourlyRateCents)} · {assignment.tutor.subjects}</p>
              </div>
              <div className="flex gap-2">
                <Link className="btn btn-line" href={`/tutors/${assignment.tutor.slug}`}>Profile</Link>
                <Link className="btn btn-primary" href={`/tutors/${assignment.tutor.slug}/book?type=session`}>Book session</Link>
                <Link className="btn btn-line" href={`/dashboard/student/messages/${assignment.tutor.userId}`}>Message</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <Empty title="No tutor assigned yet" body="You can still browse the directory and book free consultations. Ongoing tutoring appears here after we make the match." action={<Link className="btn btn-primary" href="/tutors">Find a tutor</Link>} />
        </div>
      )}
    </div>
  );
}
