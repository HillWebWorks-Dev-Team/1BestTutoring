import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { Portrait, UniversityMark } from "@/components/brand";
import { canBookPaidSession, isPublicTutor } from "@/lib/access";
import { paymentsMode } from "@/lib/brand";
import { hourly, money } from "@/lib/format";
import { live, platformSettings } from "@/lib/live";
import { tutorCanAcceptPayments } from "@/lib/access";
import { portraitFor } from "@/lib/portraits";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Book" };
export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; reschedule?: string; payment?: string; studentId?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const type = query.type === "session" ? "SESSION" : "CONSULTATION";
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({ where: { slug }, include: { user: true } });
  if (!tutor || !isPublicTutor(tutor)) notFound();
  const session = await getSession();
  const viewer = session
    ? await db.user.findUnique({
        where: { id: session.uid },
        include: { studentProfile: true, parentProfile: { include: { students: { include: { user: true } } } } },
      })
    : null;
  const settings = await platformSettings();
  const linkedIds = new Set(viewer?.parentProfile?.students.map((s) => s.id) || []);
  const studentId =
    (query.studentId && (viewer?.studentProfile?.id === query.studentId || linkedIds.has(query.studentId))
      ? query.studentId
      : null) ||
    viewer?.studentProfile?.id ||
    viewer?.parentProfile?.students[0]?.id;
  const bookQs = (kind: "consultation" | "session") => {
    const params = new URLSearchParams({ type: kind });
    if (studentId) params.set("studentId", studentId);
    if (query.reschedule) params.set("reschedule", query.reschedule);
    return `/tutors/${slug}/book?${params}`;
  };
  const assignment = studentId
    ? await db.assignment.findUnique({ where: { studentId_tutorId: { studentId, tutorId: tutor.id } } })
    : null;
  const bookingStudent = studentId
    ? await db.studentProfile.findUnique({ where: { id: studentId }, select: { creditBalanceCents: true } })
    : null;
  const creditBalance = bookingStudent?.creditBalanceCents || 0;
  const creditBalanceLabel =
    type === "SESSION" && creditBalance > 0
      ? `${money(creditBalance)} referral credit available - applied automatically at checkout (up to the platform fee; tutor rate stays the same).`
      : undefined;
  const assigned = canBookPaidSession(assignment?.status === "ACTIVE");
  const payable = tutorCanAcceptPayments(tutor, paymentsMode());
  let lockedReason: string | undefined;
  if (!viewer) lockedReason = "Create an account or sign in to confirm this time.";
  else if (viewer.role === "TUTOR" && !query.reschedule) lockedReason = "Tutor accounts book from a student or parent login.";
  else if (type === "SESSION" && !assigned) lockedReason = "Paid sessions open after our team assigns this tutor to the student.";
  else if (type === "SESSION" && !payable) lockedReason = "This tutor still needs to finish payout setup.";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit overflow-hidden">
          <Portrait name={tutor.user.name} src={portraitFor(tutor.slug, tutor.user.imageUrl)} className="aspect-[4/5] h-auto w-full rounded-none" />
          <div className="p-5">
            <p className="kicker">{type === "CONSULTATION" ? "Free consultation" : "Paid session"}</p>
            <h1 className="mt-2 font-serif text-3xl leading-none">{tutor.user.name}</h1>
            <div className="mt-3">
              <UniversityMark university={tutor.university} />
            </div>
            <p className="mt-4 text-sm leading-6 text-mute">
              {type === "CONSULTATION"
                ? "Fifteen minutes on Zoom. No charge. Choose an open time in this tutor’s calendar."
                : `A ${settings.sessionMinutes}-minute session at ${hourly(tutor.hourlyRateCents)}. Paid booking stays closed until this tutor is assigned.`}
            </p>
            <p className="mt-3 text-xs text-mute">Times are shown in your timezone. The tutor’s availability is set in {tutor.user.timezone.replaceAll("_", " ")}.</p>
          </div>
        </aside>
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Link href={bookQs("consultation")} className={`btn ${type === "CONSULTATION" ? "btn-primary" : "btn-line"}`}>
              15 min · free
            </Link>
            <Link href={bookQs("session")} className={`btn ${type === "SESSION" ? "btn-primary" : "btn-line"}`}>
              {settings.sessionMinutes} min · {hourly(tutor.hourlyRateCents)}
            </Link>
          </div>
      {query.payment === "cancelled" ? <p className="mb-4 text-sm text-[#7d332c]">Payment was cancelled. The time was released.</p> : null}
      {viewer?.parentProfile && viewer.parentProfile.students.length > 1 ? (
        <form className="mb-4" action={`/tutors/${slug}/book`}>
          <input type="hidden" name="type" value={type === "SESSION" ? "session" : "consultation"} />
          <label className="label" htmlFor="studentId">Booking for</label>
          <select id="studentId" className="field max-w-sm" name="studentId" defaultValue={studentId}>
            {viewer.parentProfile.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.user.name}
              </option>
            ))}
          </select>
          <button className="btn btn-line ml-2" type="submit">Use this student</button>
        </form>
      ) : null}
      {!viewer ? (
        <div className="mb-4 flex gap-2">
          <Link className="btn btn-primary" href={`/login?next=/tutors/${slug}/book?type=${query.type || "consultation"}`}>
            Log in to book
          </Link>
          <Link className="btn btn-line" href="/register">Create an account</Link>
        </div>
      ) : null}
      <BookingCalendar
        slug={slug}
        type={type}
        tutorTimeZone={tutor.user.timezone}
        viewerTimeZone={viewer?.timezone || "America/New_York"}
        priceLabel={hourly(tutor.hourlyRateCents)}
        rescheduleId={query.reschedule}
        studentId={studentId}
        lockedReason={lockedReason}
        creditBalanceLabel={creditBalanceLabel}
      />
        </div>
      </div>
    </div>
  );
}
