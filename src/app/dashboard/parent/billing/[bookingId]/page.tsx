import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { BRAND, paymentsMode } from "@/lib/brand";
import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ParentPaymentReceiptPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await requireUser();
  const db = await live();
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: { include: { user: true } },
      student: { include: { user: true, parent: true } },
      transaction: true,
    },
  });

  if (
    !booking ||
    booking.type !== "SESSION" ||
    booking.student.parent?.userId !== user.id
  ) {
    notFound();
  }

  const txn = booking.transaction;
  const receiptNo = txn ? `OPB-${txn.id.slice(-8).toUpperCase()}` : `OPB-${booking.id.slice(-8).toUpperCase()}`;
  const status = txn?.status || booking.status;
  const paid = status === "SUCCEEDED";
  const demo = paymentsMode() === "demo";
  const amount = Math.max(0, booking.priceCents - (txn?.refundedCents || 0));

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard/parent/billing" className="btn btn-line !px-3 !py-1.5 text-xs">
          Back
        </Link>
        <PrintButton label="Print" />
      </div>

      <article className="card p-6 print:border print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="font-serif text-2xl text-navy">{BRAND.short}</p>
            <p className="mt-1 text-sm text-mute">Payment receipt</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-navy">{receiptNo}</p>
            <p className="mt-1 text-xs text-mute">{paid ? "Paid" : status.replaceAll("_", " ").toLowerCase()}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <Line label="Student" value={booking.student.user.name} />
          <Line label="Tutor" value={booking.tutor.user.name} />
          <Line label="Session" value={formatWhen(booking.startsAt, user.timezone)} />
          <Line label="Duration" value={`${booking.durationMin} minutes`} />
          <Line label="Billed to" value={user.name} />
        </dl>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-mute">Total {paid ? "paid" : "due"}</span>
          <span className="font-serif text-3xl text-navy">{money(amount)}</span>
        </div>

        <p className="mt-6 text-xs leading-5 text-mute">
          {demo ? "Demo mode — no card was charged. " : ""}
          Keep this for your records. Contact support if you have a billing question.
        </p>
      </article>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
