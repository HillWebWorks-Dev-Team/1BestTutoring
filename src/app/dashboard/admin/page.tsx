import Link from "next/link";
import { money } from "@/lib/format";
import { live } from "@/lib/live";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireRole(["ADMIN"]);
  const db = await live();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const now = new Date();
  const [tutors, students, pending, consults, sessions, transactions, requests, assignments, waiting] =
    await Promise.all([
      db.tutorProfile.count({ where: { status: "APPROVED", active: true } }),
      db.user.count({ where: { role: "STUDENT" } }),
      db.tutorProfile.count({ where: { status: { in: ["PENDING", "WAITLISTED", "MORE_INFO"] } } }),
      db.booking.findMany({
        where: { type: "CONSULTATION", startsAt: { lt: now }, status: { in: ["CONFIRMED", "COMPLETED"] } },
        select: { studentId: true, tutorId: true },
      }),
      db.booking.findMany({
        where: { type: "SESSION", status: "COMPLETED" },
        select: { durationMin: true },
      }),
      db.transaction.findMany({
        select: { status: true, amountCents: true, netPlatformCents: true, createdAt: true },
      }),
      db.tutoringRequest.count({ where: { status: "PENDING" } }),
      db.assignment.findMany({
        where: { status: "ACTIVE" },
        select: { studentId: true, tutorId: true },
      }),
      db.studentProfile.findMany({
        where: { assignments: { none: { status: "ACTIVE" } }, requests: { some: { status: "PENDING" } } },
        include: {
          user: { select: { name: true } },
          requests: {
            where: { status: "PENDING" },
            include: { tutor: { include: { user: { select: { name: true } } } } },
          },
        },
        take: 6,
      }),
    ]);

  const pair = new Set(assignments.map((item) => `${item.studentId}:${item.tutorId}`));
  const converted = consults.filter((item) => pair.has(`${item.studentId}:${item.tutorId}`)).length;
  const succeeded = transactions.filter((item) => item.status === "SUCCEEDED");
  const revenue = succeeded.reduce((sum, item) => sum + (item.amountCents || 0), 0);
  const platform = succeeded.reduce((sum, item) => sum + (item.netPlatformCents || 0), 0);
  const hours = sessions.reduce((sum, item) => sum + (item.durationMin || 0), 0) / 60;
  const monthRevenue = succeeded
    .filter((item) => item.createdAt >= startOfMonth)
    .reduce((sum, item) => sum + (item.amountCents || 0), 0);

  const byMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, 0);
  }
  for (const item of succeeded) {
    const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) || 0) + (item.amountCents || 0));
  }
  const points = [...byMonth.entries()];
  const max = Math.max(...points.map((point) => point[1]), 1);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="kicker">Overview</p>
      <h1 className="mt-2 font-serif text-5xl text-navy">The company, at a glance.</h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active tutors" value={String(tutors)} />
        <Stat label="Students" value={String(students)} />
        <Stat label="Open applications" value={String(pending)} />
        <Stat label="Awaiting a match" value={String(requests)} />
        <Stat label="Consults held" value={String(consults.length)} />
        <Stat
          label="Consult conversion"
          value={consults.length ? `${Math.round((converted / consults.length) * 100)}%` : "—"}
        />
        <Stat label="Hours completed" value={Number.isFinite(hours) ? hours.toFixed(1) : "0.0"} />
        <Stat label="This month" value={money(monthRevenue)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="card p-5">
          <p className="kicker">Revenue</p>
          <p className="mt-2 font-serif text-4xl text-navy">{money(revenue)}</p>
          <p className="text-sm text-mute">
            Platform net after estimated or recorded processing fees: {money(platform)}
          </p>
          <div className="mt-6 flex h-40 items-end gap-3">
            {points.map(([label, value]) => (
              <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t-xl bg-navy"
                  style={{ height: `${Math.max(value > 0 ? 12 : 4, (value / max) * 100)}%` }}
                  title={money(value)}
                />
                <span className="text-[10px] uppercase tracking-wider text-mute">{label.slice(5)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="card p-5">
          <p className="kicker">Needs a decision</p>
          <div className="mt-4 space-y-3">
            {waiting.map((student) => (
              <div key={student.id}>
                <p className="font-medium text-navy">{student.user.name}</p>
                <p className="text-sm text-mute">
                  {student.requests.map((request) => request.tutor.user.name).join(", ") || "Open request"}
                </p>
              </div>
            ))}
            {!waiting.length ? <p className="text-sm text-mute">No students are waiting on a match.</p> : null}
          </div>
          <Link href="/dashboard/admin/assignments" className="btn btn-primary mt-5">
            Open matching
          </Link>
        </article>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-line bg-paper p-4">
      <p className="text-[11px] uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </article>
  );
}
