import { DashboardCalendar, type CalendarEvent } from "@/components/dashboard/DashboardCalendar";
import { Notice } from "@/components/ui";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TutorCalendar({ searchParams }: { searchParams: Promise<{ error?: string; reported?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  if (user.tutorProfile?.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const db = await live();
  const bookings = await db.booking.findMany({
    where: { tutorId: user.tutorProfile.id },
    include: { tutor: true, student: { include: { user: true } }, report: true, review: true },
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
    tutorName: user.name,
    tutorSlug: user.tutorProfile?.slug || "",
    studentName: booking.student.user.name,
    hasReport: Boolean(booking.report),
    hasReview: Boolean(booking.review),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="kicker">Schedule</p>
        <h1 className="mt-2 font-serif text-5xl">Calendar</h1>
        <p className="mt-2 text-sm text-mute">Select a day to manage consultations and tutoring sessions.</p>
      </div>
      <div className="my-4">
        <Notice error={query.error} success={query.reported ? "Report saved and the session is marked complete." : undefined} />
      </div>
      <DashboardCalendar events={events} role="TUTOR" timeZone={user.timezone} />
    </div>
  );
}
