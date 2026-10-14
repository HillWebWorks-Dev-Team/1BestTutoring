import Link from "next/link";
import {
  InsightStrip,
  RetentionRing,
  RevenueAreaChart,
  SessionMixChart,
} from "@/components/dashboard/AnalyticsCharts";
import {
  bucketBookingsByMonth,
  bucketRevenueByMonth,
  bucketRevenueByWeek,
  consultConversion,
  retentionRate,
} from "@/lib/analytics";
import { money } from "@/lib/format";
import { live } from "@/lib/live";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  await requireRole(["ADMIN"]);
  const db = await live();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [transactions, bookings, assignments, completedByStudent] = await Promise.all([
    db.transaction.findMany({
      where: { status: "SUCCEEDED" },
      select: { amountCents: true, netPlatformCents: true, tutorShareCents: true, createdAt: true },
    }),
    db.booking.findMany({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { type: true, status: true, startsAt: true, studentId: true, tutorId: true, durationMin: true },
    }),
    db.assignment.findMany({
      where: { status: "ACTIVE" },
      select: { studentId: true, tutorId: true },
    }),
    db.booking.groupBy({
      by: ["studentId"],
      where: { type: "SESSION", status: "COMPLETED" },
      _count: { _all: true },
    }),
  ]);

  const monthRevenue = bucketRevenueByMonth(transactions, now, 6);
  const weekRevenue = bucketRevenueByWeek(transactions, now, 12);
  const activity = bucketBookingsByMonth(bookings, now, 6);
  const retention = retentionRate(completedByStudent.map((row) => row._count._all));
  const consults = bookings.filter((item) => item.type === "CONSULTATION" && item.startsAt < now);
  const conversion = consultConversion({
    consultPairs: consults.map((item) => ({ studentId: item.studentId, tutorId: item.tutorId })),
    assignmentPairs: assignments,
  });

  const gross = transactions.reduce((sum, item) => sum + item.amountCents, 0);
  const platform = transactions.reduce((sum, item) => sum + item.netPlatformCents, 0);
  const tutorShare = transactions.reduce((sum, item) => sum + item.tutorShareCents, 0);
  const thisMonthGross = transactions
    .filter((item) => item.createdAt >= startOfMonth)
    .reduce((sum, item) => sum + item.amountCents, 0);
  const completedSessions = bookings.filter((item) => item.type === "SESSION" && item.status === "COMPLETED");
  const hours = completedSessions.reduce((sum, item) => sum + item.durationMin, 0) / 60;
  const recentActiveStudents = new Set(
    bookings
      .filter((item) => item.type === "SESSION" && item.startsAt >= ninetyDaysAgo)
      .map((item) => item.studentId),
  ).size;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-navy px-5 py-8 text-ivory sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Analytics</p>
            <h1 className="mt-3 font-serif text-4xl leading-none sm:text-5xl">How the desk is moving.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ivory/70">
              Revenue, consult conversion, and whether students come back for a second paid session.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/finance" className="btn btn-ghost">
              Payments ledger
            </Link>
            <Link href="/dashboard/admin/bookings" className="btn btn-primary">
              Sessions
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <InsightStrip
          items={[
            {
              label: "Gross revenue",
              value: money(gross),
              detail: `${money(thisMonthGross)} this month`,
            },
            {
              label: "Platform net",
              value: money(platform),
              detail: `Tutors earned ${money(tutorShare)}`,
            },
            {
              label: "Hours completed",
              value: hours.toFixed(1),
              detail: `${completedSessions.length} paid sessions finished`,
            },
            {
              label: "Active (90 days)",
              value: String(recentActiveStudents),
              detail: "Students with a session in the last 90 days",
            },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <RevenueAreaChart
          points={monthRevenue}
          title="Revenue"
          subtitle="Succeeded charges over the last six months"
        />
        <RetentionRing
          rate={retention.rate}
          returning={retention.returning}
          active={retention.active}
          conversionRate={conversion.rate}
          converted={conversion.converted}
          consultTotal={conversion.total}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <SessionMixChart points={activity} />
        <RevenueAreaChart
          points={weekRevenue}
          title="Weekly pulse"
          subtitle="Succeeded charges over the last twelve weeks"
        />
      </div>

      <p className="mt-6 text-xs leading-5 text-mute">
        Retention counts students with two or more completed paid sessions. Consult conversion matches a held
        consultation to an active assignment with the same tutor. Figures update as bookings and payments confirm.
      </p>
    </div>
  );
}
