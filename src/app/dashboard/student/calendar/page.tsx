import { DashboardCalendar, type CalendarEvent } from "@/components/dashboard/DashboardCalendar";
import { Notice } from "@/components/ui";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudentCalendar({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; error?: string; rescheduled?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const bookings = await db.booking.findMany({
    where: { studentId: user.studentProfile?.id || "" },
    include: { tutor: { include: { user: true } }, student: { include: { user: true } }, report: true, review: true },
    orderBy: { startsAt: "asc" },
  });

  const events: CalendarEvent[] = bookings.map((booking) => ({
    id: booking.id,
    type: booking.type,
    status: booking.status,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    priceCents: booking.priceCents,
    zoomJoinUrl: booking.zoomJoinUrl,
    zoomStartUrl: booking.zoomStartUrl,
    tutorName: booking.tutor.user.name,
    tutorSlug: booking.tutor.slug,
    studentName: booking.student.user.name,
    hasReport: Boolean(booking.report),
    hasReview: Boolean(booking.review),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Schedule</p>
          <h1 className="mt-2 font-serif text-5xl">Calendar</h1>
          <p className="mt-2 text-sm text-mute">Select a day to see consultations and tutoring sessions.</p>
        </div>
      </div>
      <div className="my-4">
        <Notice
          success={
            query.booked
              ? "Booking confirmed. Find it on the calendar below."
              : query.rescheduled
                ? "The time has been moved."
                : undefined
          }
          error={query.error}
        />
      </div>
      <DashboardCalendar events={events} role="STUDENT" timeZone={user.timezone} />
    </div>
  );
}
