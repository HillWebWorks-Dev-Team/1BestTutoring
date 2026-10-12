import { DashboardCalendar, type CalendarEvent } from "@/components/dashboard/DashboardCalendar";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ParentCalendar() {
  const user = await requireUser();
  const db = await live();
  const students = await db.studentProfile.findMany({ where: { parentId: user.parentProfile?.id || "" } });
  const bookings = await db.booking.findMany({
    where: { studentId: { in: students.map((student) => student.id) } },
    include: {
      tutor: { include: { user: true } },
      student: { include: { user: true } },
      report: true,
      review: true,
    },
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
      <p className="kicker">Family</p>
      <h1 className="mt-2 font-serif text-5xl">Calendar</h1>
      <p className="mt-2 text-sm text-mute">Select a day to see your children’s consultations and sessions.</p>
      <div className="mt-6">
        <DashboardCalendar events={events} role="PARENT" timeZone={user.timezone} />
      </div>
    </div>
  );
}
