import Link from "next/link";
import { Notice } from "@/components/ui";
import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { universityFor } from "@/lib/universities";
import { linkChild } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function ParentHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; linked?: string; requested?: string; booked?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const parentId = user.parentProfile?.id || "";
  const students = await db.studentProfile.findMany({
    where: { parentId },
    include: {
      user: true,
      assignments: {
        where: { status: "ACTIVE" },
        include: { tutor: { include: { user: true } } },
      },
    },
  });
  const studentIds = students.map((student) => student.id);
  const [upcoming, unpaid] = await Promise.all([
    studentIds.length
      ? db.booking.findMany({
          where: {
            studentId: { in: studentIds },
            status: "CONFIRMED",
            startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          },
          include: {
            tutor: { include: { user: true } },
            student: { include: { user: true } },
          },
          orderBy: { startsAt: "asc" },
          take: 6,
        })
      : Promise.resolve([]),
    studentIds.length
      ? db.booking.findMany({
          where: { studentId: { in: studentIds }, status: "PENDING_PAYMENT", type: "SESSION" },
          include: {
            tutor: { include: { user: true } },
            student: { include: { user: true } },
          },
          orderBy: { startsAt: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);
  const next = upcoming[0];
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Family desk</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Welcome back, {firstName}.</h1>
          <p className="mt-2 text-sm text-mute">
            Book, pay, and track progress for linked students from one place.
            {students.length ? ` · ${students.length} student${students.length === 1 ? "" : "s"} linked` : ""}
            {upcoming.length ? ` · ${upcoming.length} upcoming` : ""}
            {unpaid.length ? ` · ${unpaid.length} awaiting payment` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/parent/calendar" className="btn btn-line">
            Full calendar
          </Link>
          <Link href="/tutors" className="btn btn-primary">
            Browse tutors
          </Link>
        </div>
      </div>

      <div className="my-4">
        <Notice
          error={query.error}
          success={
            query.linked
              ? "Student linked."
              : query.requested
                ? "Request sent to the matching desk."
                : query.booked
                  ? "Booking confirmed."
                  : undefined
          }
        />
      </div>

      {next ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Next session</h2>
            <Link href="/dashboard/parent/calendar" className="text-sm text-mute hover:text-navy">
              View all
            </Link>
          </div>
          <article className="card overflow-hidden bg-navy text-ivory">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="kicker">
                  {next.student.user.name} · {next.type === "CONSULTATION" ? "Free consultation" : "Tutoring session"}
                </p>
                <h3 className="mt-3 font-serif text-4xl leading-none">{next.tutor.user.name}</h3>
                <p className="mt-3 text-lg text-ivory/85">{formatWhen(next.startsAt, user.timezone)}</p>
                <p className="mt-1 text-sm text-ivory/60">
                  {next.priceCents ? money(next.priceCents) : "No charge"} · {universityFor(next.tutor.university).short}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                {next.zoomJoinUrl ? (
                  <a className="btn btn-primary" href={next.zoomJoinUrl} target="_blank" rel="noreferrer">
                    Join Zoom
                  </a>
                ) : null}
                <a className="btn btn-ghost" href={`/api/bookings/${next.id}/calendar`}>
                  Add to calendar
                </a>
                <Link className="btn btn-ghost" href={`/dashboard/bookings/${next.id}`}>
                  Booking summary
                </Link>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {unpaid.length ? (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Awaiting payment</h2>
          <ul className="mt-3 grid gap-2">
            {unpaid.map((booking) => (
              <li key={booking.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-navy">
                    {booking.student.user.name} · {booking.tutor.user.name}
                  </p>
                  <p className="text-sm text-mute">
                    {formatWhen(booking.startsAt, user.timezone)} · {money(booking.priceCents)}
                  </p>
                </div>
                <Link className="btn btn-primary" href={`/dashboard/bookings/${booking.id}`}>
                  Finish payment
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Students</h2>
        <div className="mt-4 grid gap-4">
          {students.map((student) => {
            const primaryTutor = student.assignments[0]?.tutor;
            return (
              <article key={student.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-3xl">{student.user.name}</h3>
                    <p className="mt-1 text-sm text-mute">
                      {student.gradeLevel || "Grade unset"}
                      {student.goals ? ` · ${student.goals}` : " · No goals yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn btn-primary" href={`/tutors?studentId=${student.id}`}>
                      Book for {student.user.name.split(" ")[0]}
                    </Link>
                    {primaryTutor ? (
                      <Link
                        className="btn btn-line"
                        href={`/tutors/${primaryTutor.slug}/book?type=session&studentId=${student.id}`}
                      >
                        Book {primaryTutor.user.name.split(" ")[0]}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <ul className="mt-3 text-sm">
                  {student.assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <span className="font-medium">{assignment.tutor.user.name}</span>
                      <span className="text-mute"> · {universityFor(assignment.tutor.university).short}</span>
                    </li>
                  ))}
                  {!student.assignments.length ? (
                    <li className="text-mute">No tutor assigned yet. You can still book a free consultation.</li>
                  ) : null}
                </ul>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link className="font-medium text-navy underline-offset-2 hover:underline" href={`/dashboard/parent/progress?studentId=${student.id}`}>
                    Progress
                  </Link>
                  <Link className="font-medium text-navy underline-offset-2 hover:underline" href="/dashboard/parent/billing">
                    Billing
                  </Link>
                  <Link className="font-medium text-navy underline-offset-2 hover:underline" href="/dashboard/parent/calendar">
                    Calendar
                  </Link>
                </div>
              </article>
            );
          })}
          {!students.length ? (
            <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-8 text-sm text-mute">
              No students linked yet. Add a student email below after they list you as guardian.
            </p>
          ) : null}
        </div>
      </section>

      <form action={linkChild} className="card mt-8 grid gap-3 p-5">
        <p className="font-serif text-2xl">Link a student</p>
        <p className="text-sm text-mute">The student account must list this email as the guardian email.</p>
        <input className="field" type="email" name="email" placeholder="Student email" required />
        <button className="btn btn-primary w-fit" type="submit">
          Link
        </button>
      </form>
    </div>
  );
}
