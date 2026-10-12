import Link from "next/link";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { SessionList, type SessionItem } from "@/components/dashboard/SessionList";
import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";
import { requireUser } from "@/lib/session";
import { universityFor } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function StudentHome({ searchParams }: { searchParams: Promise<{ requested?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const studentId = user.studentProfile?.id || "";
  const [assignments, bookings, homework, unread] = await Promise.all([
    db.assignment.findMany({
      where: { studentId, status: "ACTIVE" },
      include: { tutor: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.booking.findMany({
      where: { studentId, status: { in: ["CONFIRMED", "COMPLETED"] }, startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
      include: { tutor: { include: { user: true } }, student: { include: { user: true } }, report: true, review: true },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    db.homework.findMany({
      where: { studentId, status: { in: ["ASSIGNED", "SUBMITTED"] } },
      include: { tutor: { include: { user: true } } },
      orderBy: { dueAt: "asc" },
      take: 3,
    }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  const next = bookings.find((booking) => booking.status === "CONFIRMED");
  const later = bookings.filter((booking) => booking.id !== next?.id && booking.status === "CONFIRMED");
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Overview</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Welcome back, {firstName}.</h1>
          <p className="mt-2 text-sm text-mute">
            {assignments.length
              ? `${assignments.length} assigned tutor${assignments.length === 1 ? "" : "s"} · ${later.length + (next ? 1 : 0)} upcoming`
              : "Browse tutors and book a free consultation anytime."}
            {unread ? ` · ${unread} new notification${unread === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/student/calendar" className="btn btn-line">
            Full calendar
          </Link>
          {assignments.length ? (
            <Link href={`/tutors/${assignments[0].tutor.slug}/book?type=session`} className="btn btn-primary">
              Book a session
            </Link>
          ) : (
            <Link href="/tutors" className="btn btn-primary">
              Find a tutor
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Notice success={query.requested ? "Request sent. We’ll confirm the match before tutoring begins." : undefined} error={query.error} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Your next session</h2>
          {next ? (
            <Link href="/dashboard/student/calendar" className="text-sm text-mute hover:text-navy">
              View all
            </Link>
          ) : null}
        </div>
        {next ? (
          <article className="card overflow-hidden bg-navy text-ivory">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="kicker">
                  {next.type === "CONSULTATION" ? "Free consultation" : "Tutoring session"} · confirmed
                </p>
                <h3 className="mt-3 font-serif text-4xl leading-none">{next.tutor.user.name}</h3>
                <p className="mt-3 text-lg text-ivory/85">{formatWhen(next.startsAt, user.timezone)}</p>
                <p className="mt-1 text-sm text-ivory/60">
                  {next.priceCents ? money(next.priceCents) : "No charge"} · {universityFor(next.tutor.university).short}
                </p>
                {!next.zoomJoinUrl ? (
                  <p className="mt-4 text-sm text-ivory/55">Zoom link will appear here once Zoom is connected.</p>
                ) : null}
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
                <Link
                  className="btn btn-ghost"
                  href={`/tutors/${next.tutor.slug}/book?type=${next.type === "CONSULTATION" ? "consultation" : "session"}&reschedule=${next.id}`}
                >
                  Reschedule
                </Link>
                <Link className="btn btn-ghost" href={`/tutors/${next.tutor.slug}`}>
                  Tutor profile
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <article className="card p-6">
            <h3 className="font-serif text-3xl">Nothing scheduled yet</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-mute">
              {assignments.length
                ? "Book your next paid hour with an assigned tutor, or open the calendar to manage existing bookings."
                : "Start with a free 15-minute consultation. Ongoing tutoring unlocks after we assign a tutor."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {assignments.length ? (
                <Link href={`/tutors/${assignments[0].tutor.slug}/book?type=session`} className="btn btn-primary">
                  Book a session
                </Link>
              ) : (
                <Link href="/tutors" className="btn btn-primary">
                  Book a free consultation
                </Link>
              )}
              <Link href="/dashboard/student/calendar" className="btn btn-line">
                Open calendar
              </Link>
            </div>
          </article>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Your tutors</h2>
          <Link href="/dashboard/student/tutors" className="text-sm text-mute hover:text-navy">
            Manage
          </Link>
        </div>
        {assignments.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {assignments.map((assignment) => (
              <article key={assignment.id} className="card flex items-center gap-4 p-4">
                <Portrait
                  name={assignment.tutor.user.name}
                  src={portraitFor(assignment.tutor.slug, assignment.tutor.user.imageUrl)}
                  className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{assignment.tutor.user.name}</p>
                  <p className="truncate text-sm text-mute">
                    {universityFor(assignment.tutor.university).short} · {money(assignment.tutor.hourlyRateCents)}/hr
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link className="btn btn-primary !px-3 !py-1.5 text-xs" href={`/tutors/${assignment.tutor.slug}/book?type=session`}>
                      Book session
                    </Link>
                    <Link className="btn btn-line !px-3 !py-1.5 text-xs" href={`/dashboard/student/messages/${assignment.tutor.userId}`}>
                      Message
                    </Link>
                    <Link className="btn btn-line !px-3 !py-1.5 text-xs" href={`/tutors/${assignment.tutor.slug}`}>
                      Profile
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="card p-5">
            <p className="text-sm leading-6 text-mute">
              No assigned tutors yet. You can still browse the directory and book free consultations. Paid sessions and messaging unlock after we confirm a match.
            </p>
            <Link href="/tutors" className="btn btn-line mt-4">
              Browse tutors
            </Link>
          </article>
        )}
      </section>

      {later.length ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Later this week</h2>
            <Link href="/dashboard/student/calendar" className="text-sm text-mute hover:text-navy">
              Calendar
            </Link>
          </div>
          <SessionList items={later.map(toItem)} role="STUDENT" timeZone={user.timezone} compact />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Homework</h2>
          <Link href="/dashboard/student/homework" className="text-sm text-mute hover:text-navy">
            All homework
          </Link>
        </div>
        {homework.length ? (
          <div className="grid gap-3">
            {homework.map((item) => (
              <Link key={item.id} href="/dashboard/student/homework" className="card block px-4 py-3 transition hover:border-gold/40">
                <span className="font-medium">{item.title}</span>
                <span className="block text-sm text-mute">
                  {item.tutor.user.name} · {item.status === "SUBMITTED" ? "Awaiting feedback" : "To do"}
                  {item.dueAt ? ` · due ${formatWhen(item.dueAt, user.timezone, false)}` : ""}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-mute">
            No open assignments. New homework from your tutors will show up here.
          </p>
        )}
      </section>
    </div>
  );
}

function toItem(booking: {
  id: string;
  type: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  tutor: { slug: string; university: string; user: { name: string } };
  student: { user: { name: string } };
  report: { id: string } | null;
  review: { id: string } | null;
}): SessionItem {
  return {
    id: booking.id,
    type: booking.type,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    priceCents: booking.priceCents,
    zoomJoinUrl: booking.zoomJoinUrl,
    zoomStartUrl: booking.zoomStartUrl,
    tutorName: booking.tutor.user.name,
    tutorSlug: booking.tutor.slug,
    studentName: booking.student.user.name,
    hasReport: Boolean(booking.report),
    hasReview: Boolean(booking.review),
  };
}
