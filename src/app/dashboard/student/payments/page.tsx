import Link from "next/link";
import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { paymentsMode } from "@/lib/brand";
import { requireUser } from "@/lib/session";
import { universityFor } from "@/lib/universities";

export const dynamic = "force-dynamic";

function statusLabel(value: string) {
  if (value === "SUCCEEDED") return "Paid";
  return value.replaceAll("_", " ").toLowerCase();
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const query = await searchParams;
  const filter = query.filter === "paid" || query.filter === "month" || query.filter === "refunded" ? query.filter : "all";
  const user = await requireUser();
  const db = await live();
  const bookings = await db.booking.findMany({
    where: { studentId: user.studentProfile?.id || "", type: "SESSION" },
    include: { tutor: { include: { user: true } }, transaction: true },
    orderBy: { startsAt: "desc" },
  });

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const paid = bookings.filter((booking) => booking.transaction?.status === "SUCCEEDED");
  const refunded = bookings.filter((booking) => (booking.transaction?.refundedCents || 0) > 0);
  const monthBookings = paid.filter((booking) => (booking.transaction?.createdAt || booking.startsAt) >= thisMonthStart);
  const totalPaid = paid.reduce((sum, booking) => sum + booking.priceCents, 0);
  const totalRefunded = refunded.reduce((sum, booking) => sum + (booking.transaction?.refundedCents || 0), 0);
  const monthPaid = monthBookings.reduce((sum, booking) => sum + booking.priceCents, 0);
  const demo = paymentsMode() === "demo";

  const visible =
    filter === "paid"
      ? paid
      : filter === "month"
        ? monthBookings
        : filter === "refunded"
          ? refunded
          : bookings;

  const historyLabel =
    filter === "paid"
      ? "Paid sessions"
      : filter === "month"
        ? "This month"
        : filter === "refunded"
          ? "Refunded sessions"
          : "Payment history";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Billing</p>
          <h1 className="mt-2 font-serif text-5xl">Payments</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
            Pay per hour - no subscription. Click a summary card to filter the list, then open a receipt to print or save.
          </p>
        </div>
      </div>

      {demo ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">
          Demo payments are on. Amounts and splits are calculated for real, but no card is charged until Stripe keys are added.
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat
          href="/dashboard/student/payments?filter=paid"
          label="Total paid"
          value={money(totalPaid)}
          detail={`${paid.length} successful payment${paid.length === 1 ? "" : "s"}`}
          active={filter === "paid"}
        />
        <Stat
          href="/dashboard/student/payments?filter=month"
          label="This month"
          value={money(monthPaid)}
          detail="Successful session charges"
          active={filter === "month"}
        />
        <Stat
          href="/dashboard/student/payments?filter=refunded"
          label="Refunded"
          value={money(totalRefunded)}
          detail={totalRefunded ? "Returned to your payment method" : "No refunds"}
          active={filter === "refunded"}
        />
      </section>

      <section className="mt-8" id="history">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">{historyLabel}</h2>
          <div className="flex items-center gap-3 text-sm">
            <p className="text-mute">
              {visible.length} session{visible.length === 1 ? "" : "s"}
            </p>
            {filter !== "all" ? (
              <Link href="/dashboard/student/payments" className="font-medium text-navy underline-offset-2 hover:underline">
                Show all
              </Link>
            ) : null}
          </div>
        </div>

        {visible.length ? (
          <div className="card overflow-hidden">
            <div className="hidden border-b border-line bg-ivory px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-mute sm:grid sm:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_auto] sm:gap-4">
              <span>Tutor</span>
              <span>When</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
              <span className="w-24 text-right">Receipt</span>
            </div>
            <ul className="divide-y divide-line">
              {visible.map((booking) => {
                const status = booking.transaction?.status || booking.status;
                const hasReceipt =
                  Boolean(booking.transaction) || status === "SUCCEEDED" || status === "COMPLETED" || status === "CONFIRMED";

                return (
                  <li
                    key={booking.id}
                    className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_auto] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{booking.tutor.user.name}</p>
                      <p className="truncate text-xs text-mute sm:hidden">{formatWhen(booking.startsAt, user.timezone)}</p>
                      <p className="hidden truncate text-xs text-mute sm:block">{universityFor(booking.tutor.university).short}</p>
                    </div>
                    <p className="hidden text-sm text-mute sm:block">{formatWhen(booking.startsAt, user.timezone)}</p>
                    <p className="text-sm capitalize text-mute">{statusLabel(status)}</p>
                    <p className="text-sm font-semibold text-navy sm:text-right">{money(booking.priceCents)}</p>
                    <div className="sm:w-24 sm:text-right">
                      {hasReceipt ? (
                        <Link
                          href={`/dashboard/student/payments/${booking.id}`}
                          className="text-sm font-medium text-navy underline-offset-2 hover:underline"
                        >
                          Receipt
                        </Link>
                      ) : (
                        <span className="text-sm text-mute">-</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-10 text-center text-sm text-mute">
            {filter === "refunded"
              ? "No refunds in your history."
              : filter === "month"
                ? "No successful payments this month yet."
                : filter === "paid"
                  ? "No successful payments yet."
                  : "No paid sessions yet. After you book tutoring hours with an assigned tutor, receipts will appear here."}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  href,
  label,
  value,
  detail,
  active,
}: {
  href: string;
  label: string;
  value: string;
  detail: string;
  active: boolean;
}) {
  return (
    <Link
      href={`${href}#history`}
      className={`card block p-4 transition hover:-translate-y-0.5 hover:border-gold/50 focus-visible:border-gold ${
        active ? "border-gold/60 ring-2 ring-gold/25" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
      <p className="mt-1 text-xs text-mute">{detail}</p>
      <p className="mt-3 text-xs font-medium text-navy">{active ? "Showing this list" : "View list"}</p>
    </Link>
  );
}
