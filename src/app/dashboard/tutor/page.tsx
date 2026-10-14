import Link from "next/link";
import { Notice } from "@/components/ui";
import { money, formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TutorHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const profile = user.tutorProfile;
  if (!profile) return null;
  const db = await live();
  if (profile.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="kicker">Overview</p>
        <h1 className="mt-2 font-serif text-5xl">You’re in review.</h1>
        <p className="mt-4 text-mute">Status: {profile.status.replaceAll("_", " ")}. The directory and student tools stay closed until we approve the application.</p>
        {profile.moreInfoRequest ? <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm">{profile.moreInfoRequest}</p> : null}
        <Link href="/dashboard/tutor/application" className="btn btn-primary mt-6">View application</Link>
      </div>
    );
  }
  const [students, upcoming, paid] = await Promise.all([
    db.assignment.count({ where: { tutorId: profile.id, status: "ACTIVE" } }),
    db.booking.findMany({
      where: { tutorId: profile.id, status: "CONFIRMED", startsAt: { gte: new Date() } },
      include: { student: { include: { user: true } } },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    db.transaction.findMany({
      where: { status: "SUCCEEDED", booking: { tutorId: profile.id } },
    }),
  ]);
  const earned = paid.reduce((sum, item) => sum + item.tutorShareCents, 0);
  return (
    <div className="mx-auto max-w-5xl">
      <Notice error={query.error} />
      <p className="kicker">Tutor desk</p>
      <h1 className="mt-2 font-serif text-5xl">{user.name.split(" ")[0]}, your roster.</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label="Assigned students" value={String(students)} />
        <Stat label="Your rate" value={money(profile.hourlyRateCents)} />
        <Stat label="Recorded earnings" value={money(earned)} />
      </div>
      {!profile.stripeChargesEnabled ? (
        <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">Payout setup is incomplete. Consultations can still be booked. Paid sessions wait on Stripe Connect once live payments are on. <Link href="/dashboard/tutor/earnings" className="underline">Open earnings</Link></p>
      ) : null}
      <h2 className="mb-4 mt-10 font-serif text-3xl">Upcoming</h2>
      <div className="grid gap-3">
        {upcoming.map((booking) => (
          <div key={booking.id} className="rounded-2xl border border-line bg-paper px-4 py-3">
            <p className="font-medium">{booking.student.user.name}</p>
            <p className="text-sm text-mute">{booking.type === "CONSULTATION" ? "Consultation" : "Session"} · {formatWhen(booking.startsAt, user.timezone)}</p>
          </div>
        ))}
        {!upcoming.length ? <p className="text-sm text-mute">No upcoming bookings.</p> : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="card p-5">
      <p className="text-xs uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </article>
  );
}
