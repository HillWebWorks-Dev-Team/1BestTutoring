import Link from "next/link";
import { notFound } from "next/navigation";
import { Portrait, UniversityMark } from "@/components/brand";
import { BookingPendingRefresh } from "@/components/dashboard/BookingPendingRefresh";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { confirmPaidBooking } from "@/lib/confirm-paid-booking";
import { paymentsMode } from "@/lib/brand";
import { formatDay, formatTime, money } from "@/lib/format";
import { live } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { ensureBookingZoom } from "@/server/ensure-zoom";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking summary" };

export default async function BookingSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();

  let booking = await db.booking.findUnique({
    where: { id },
    include: {
      tutor: { include: { user: true } },
      student: { include: { user: true, parent: true } },
      transaction: true,
    },
  });
  if (!booking) notFound();

  const allowed =
    user.role === "ADMIN" ||
    booking.student.userId === user.id ||
    booking.tutor.userId === user.id ||
    booking.student.parent?.userId === user.id;
  if (!allowed) notFound();

  if (booking.status === "PENDING_PAYMENT" && booking.stripeCheckoutSessionId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripeCheckoutSessionId);
        if (session.payment_status === "paid" || session.status === "complete") {
          await confirmPaidBooking(booking.id, session);
          booking = await db.booking.findUniqueOrThrow({
            where: { id },
            include: {
              tutor: { include: { user: true } },
              student: { include: { user: true, parent: true } },
              transaction: true,
            },
          });
        }
      } catch {
        // Webhook may still confirm; page will auto-refresh while pending.
      }
    }
  }

  if ((booking.status === "CONFIRMED" || booking.status === "COMPLETED") && !booking.zoomJoinUrl) {
    const withZoom = await ensureBookingZoom(booking.id);
    if (withZoom?.zoomJoinUrl) {
      booking = await db.booking.findUniqueOrThrow({
        where: { id },
        include: {
          tutor: { include: { user: true } },
          student: { include: { user: true, parent: true } },
          transaction: true,
        },
      });
    }
  }

  const isTutor = booking.tutor.userId === user.id;
  const zoomUrl = isTutor ? booking.zoomStartUrl || booking.zoomJoinUrl : booking.zoomJoinUrl;
  const label = booking.type === "CONSULTATION" ? "Free consultation" : "Tutoring session";
  const pending = booking.status === "PENDING_PAYMENT";
  const confirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
  const cancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";
  const demo = paymentsMode() === "demo";
  const calendarHref = isTutor ? "/dashboard/tutor/calendar" : user.role === "PARENT" ? "/dashboard/parent/calendar" : "/dashboard/student/calendar";
  const homeHref = isTutor ? "/dashboard/tutor" : user.role === "PARENT" ? "/dashboard/parent" : "/dashboard/student";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={homeHref} className="btn btn-line !px-3 !py-1.5 text-xs">
          Back to dashboard
        </Link>
        <div className="flex flex-wrap gap-2">
          <PrintButton label="Print summary" />
          <Link href={calendarHref} className="btn btn-line !px-3 !py-1.5 text-xs">
            Open calendar
          </Link>
        </div>
      </div>

      {pending ? <BookingPendingRefresh /> : null}
      {query.paid && confirmed ? (
        <p className="mb-4 rounded-xl border border-gold/35 bg-cream/50 px-4 py-3 text-sm text-navy print:hidden">
          Payment received. Here’s your booking summary.
        </p>
      ) : null}

      <article className="card overflow-hidden print:border print:shadow-none">
        <div className="bg-navy px-5 py-6 text-ivory sm:px-6">
          <p className="kicker">{pending ? "Payment processing" : cancelled ? "Booking update" : "Confirmed"}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
            {pending ? "Finishing your booking…" : cancelled ? "This booking was cancelled" : "You’re booked"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-ivory/70">
            {pending
              ? "Stripe is confirming payment. Your Zoom link will appear here next."
              : cancelled
                ? booking.cancelReason || "This time is no longer reserved."
                : `${label} with ${isTutor ? booking.student.user.name : booking.tutor.user.name}`}
          </p>
        </div>

        <div className="flex items-center gap-4 border-b border-line px-5 py-5 sm:px-6">
          <Portrait
            name={booking.tutor.user.name}
            src={portraitFor(booking.tutor.slug, booking.tutor.user.imageUrl)}
            className="h-16 w-16 shrink-0 rounded-2xl"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              {label} · {booking.status.replaceAll("_", " ").toLowerCase()}
            </p>
            <h2 className="truncate font-serif text-2xl text-navy">{booking.tutor.user.name}</h2>
            <div className="mt-1.5">
              <UniversityMark university={booking.tutor.university} compact />
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <dl className="divide-y divide-line rounded-2xl border border-line">
            <Row label="Student" value={booking.student.user.name} />
            <Row label="Date" value={formatDay(booking.startsAt, user.timezone)} />
            <Row
              label="Time"
              value={`${formatTime(booking.startsAt, user.timezone)} – ${formatTime(booking.endsAt, user.timezone)}`}
            />
            <Row label="Duration" value={`${booking.durationMin} minutes`} />
            <Row label="Timezone" value={user.timezone.replaceAll("_", " ")} />
            <Row
              label={booking.type === "CONSULTATION" ? "Price" : "Amount"}
              value={booking.priceCents ? money(booking.priceCents) : "Free"}
            />
            {booking.transaction ? <Row label="Payment" value={booking.transaction.status.toLowerCase()} /> : null}
          </dl>

          <div className="mt-5 rounded-2xl border border-line bg-mist/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">Zoom meeting</p>
              {booking.zoomMeetingId ? <p className="text-xs text-mute">ID {booking.zoomMeetingId}</p> : null}
            </div>

            {zoomUrl && confirmed ? (
              <div className="mt-3">
                <a className="break-all text-sm font-medium text-navy underline decoration-gold/50 underline-offset-2" href={zoomUrl} target="_blank" rel="noreferrer">
                  {zoomUrl}
                </a>
                <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                  <a className="btn btn-primary" href={zoomUrl} target="_blank" rel="noreferrer">
                    {isTutor ? "Start Zoom" : "Join Zoom"}
                  </a>
                  <a className="btn btn-line" href={`/api/bookings/${booking.id}/calendar`}>
                    Add to calendar
                  </a>
                  <Link className="btn btn-line" href={`/tutors/${booking.tutor.slug}`}>
                    Tutor profile
                  </Link>
                </div>
              </div>
            ) : pending ? (
              <p className="mt-3 text-sm text-mute">Zoom link appears as soon as payment confirms.</p>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-mute">
                  Zoom isn’t connected or the meeting couldn’t be created yet. Add this booking to your calendar for now.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                  <a className="btn btn-line" href={`/api/bookings/${booking.id}/calendar`}>
                    Add to calendar
                  </a>
                  <Link className="btn btn-line" href={`/tutors/${booking.tutor.slug}`}>
                    Tutor profile
                  </Link>
                </div>
              </div>
            )}
          </div>

          {booking.type === "SESSION" && !isTutor && confirmed ? (
            <div className="mt-4 print:hidden">
              <Link className="btn btn-line" href={`/dashboard/student/payments/${booking.id}`}>
                View payment receipt
              </Link>
            </div>
          ) : null}

          <p className="mt-5 text-xs leading-5 text-mute">
            Booking ID: {booking.id}
            {demo && booking.type === "SESSION" ? " · Demo mode — no card was charged." : ""}
          </p>
        </div>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
      <dt className="shrink-0 text-mute">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
