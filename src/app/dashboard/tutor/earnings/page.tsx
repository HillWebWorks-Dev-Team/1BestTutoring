import { redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { paymentsMode } from "@/lib/brand";
import { money, formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { startStripeConnect, syncStripeAccount } from "@/server/tutor";

export const dynamic = "force-dynamic";

export default async function EarningsPage({ searchParams }: { searchParams: Promise<{ error?: string; stripe?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  if (user.tutorProfile?.status !== "APPROVED") redirect("/dashboard/tutor/application");
  if (query.stripe === "return") await syncStripeAccount();
  const db = await live();
  const profile = await db.tutorProfile.findUniqueOrThrow({ where: { id: user.tutorProfile.id } });
  const transactions = await db.transaction.findMany({
    where: { booking: { tutorId: profile.id } },
    include: { booking: { include: { student: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const earned = transactions.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + item.tutorShareCents, 0);
  const ready = profile.stripeChargesEnabled && profile.stripePayoutsEnabled;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Earnings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">You set the hourly rate. The platform commission is applied automatically and is not editable here. Your share is calculated before card-processing fees, which the company commission is meant to cover.</p>
      <div className="my-4"><Notice error={query.error} /></div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="card p-5"><p className="text-xs uppercase tracking-wider text-mute">Rate</p><p className="font-serif text-4xl">{money(profile.hourlyRateCents)}</p></article>
        <article className="card p-5"><p className="text-xs uppercase tracking-wider text-mute">Your share recorded</p><p className="font-serif text-4xl">{money(earned)}</p></article>
        <article className="card p-5"><p className="text-xs uppercase tracking-wider text-mute">Payouts</p><p className="mt-2 text-sm">{ready ? "Stripe Connect is ready." : paymentsMode() === "demo" ? "Demo mode. Connect Stripe to receive live payouts." : "Stripe onboarding is incomplete."}</p></article>
      </div>
      <form action={startStripeConnect} className="mt-6">
        <button className="btn btn-primary" type="submit">{profile.stripeAccountId ? "Continue Stripe setup" : "Start Stripe Connect"}</button>
      </form>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="py-2">Date</th><th>Student</th><th>Session</th><th>Your share</th><th>Status</th></tr></thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="py-3">{formatWhen(item.createdAt, user.timezone, false)}</td>
                <td>{item.booking.student.user.name}</td>
                <td>{money(item.amountCents)}</td>
                <td>{money(item.tutorShareCents)}</td>
                <td>{item.status.toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
