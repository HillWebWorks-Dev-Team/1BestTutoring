import Link from "next/link";
import { Search } from "lucide-react";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { formatWhen, money } from "@/lib/format";
import { live, platformSettings } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";
import { adminRefund } from "@/server/admin";

export const dynamic = "force-dynamic";

type Filter = "all" | "succeeded" | "refunded" | "failed";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "succeeded", label: "Succeeded" },
  { id: "refunded", label: "Refunded" },
  { id: "failed", label: "Failed" },
];

function statusTone(status: string): "good" | "warn" | "bad" | "neutral" {
  if (status === "SUCCEEDED") return "good";
  if (status === "REFUNDED") return "warn";
  if (status === "FAILED") return "bad";
  return "neutral";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; refunded?: string; q?: string; filter?: string }>;
}) {
  const query = await searchParams;
  const q = (query.q || "").trim().toLowerCase();
  const filter = (FILTERS.some((item) => item.id === query.filter) ? query.filter : "all") as Filter;
  const db = await live();
  const settings = await platformSettings();
  const transactions = await db.transaction.findMany({
    include: {
      booking: {
        include: {
          student: { include: { user: true } },
          tutor: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ok = transactions.filter((item) => item.status === "SUCCEEDED");
  const gross = ok.reduce((sum, item) => sum + item.amountCents, 0);
  const tutorShare = ok.reduce((sum, item) => sum + item.tutorShareCents, 0);
  const commission = ok.reduce((sum, item) => sum + item.platformShareCents, 0);
  const net = ok.reduce((sum, item) => sum + item.netPlatformCents, 0);

  const visible = transactions.filter((item) => {
    if (q) {
      const haystack = `${item.booking.student.user.name} ${item.booking.tutor.user.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filter === "succeeded") return item.status === "SUCCEEDED";
    if (filter === "refunded") return item.status === "REFUNDED";
    if (filter === "failed") return item.status === "FAILED";
    return true;
  });

  const counts = {
    all: transactions.length,
    succeeded: transactions.filter((item) => item.status === "SUCCEEDED").length,
    refunded: transactions.filter((item) => item.status === "REFUNDED").length,
    failed: transactions.filter((item) => item.status === "FAILED").length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="kicker">Finance</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-navy">Payments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            Commission is {settings.commissionPercent}%. Tutor share is not reduced by card fees. Platform net is
            commission minus processing fees.
          </p>
        </div>
        <Link href="/dashboard/admin/bookings" className="btn btn-line">
          View sessions
        </Link>
      </div>

      <div className="my-5">
        <Notice error={query.error} success={query.refunded ? "Refund recorded." : undefined} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Gross" value={money(gross)} />
        <Tile label="Tutor share" value={money(tutorShare)} />
        <Tile label="Commission" value={money(commission)} />
        <Tile label="Net after fees" value={money(net)} />
      </div>

      <div className="mt-6 rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="filter" value={filter} />
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input
              className="field !pl-10"
              name="q"
              placeholder="Search student or tutor"
              defaultValue={query.q || ""}
            />
          </label>
          <button className="btn btn-primary shrink-0" type="submit">
            Search
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            const href =
              item.id === "all" && !q
                ? "/dashboard/admin/finance"
                : `/dashboard/admin/finance?filter=${item.id}${q ? `&q=${encodeURIComponent(query.q || "")}` : ""}`;
            return (
              <Link
                key={item.id}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-navy text-ivory" : "bg-ivory text-navy hover:bg-cream"
                }`}
              >
                {item.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-ivory" : "bg-paper text-mute"}`}>
                  {counts[item.id]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visible.map((item) => {
          const student = item.booking.student.user;
          const tutor = item.booking.tutor.user;
          return (
            <article key={item.id} className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-2xl leading-none text-navy">{money(item.amountCents)}</p>
                    <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-mute">
                    {formatWhen(item.createdAt, "America/New_York", false)}
                    {item.booking.type === "CONSULTATION" ? " · Consultation" : " · Session"}
                  </p>
                </div>
                {item.status === "SUCCEEDED" ? (
                  <form action={adminRefund}>
                    <input type="hidden" name="bookingId" value={item.bookingId} />
                    <button className="btn btn-line !px-3 !py-1.5 text-xs" type="submit">
                      Refund
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-ivory/70 px-3 py-3">
                  <Portrait
                    name={student.name}
                    src={portraitFor(student.email, student.imageUrl, student.name)}
                    className="h-11 w-11 shrink-0 rounded-full text-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Student</p>
                    <p className="truncate text-sm font-medium text-navy">{student.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-ivory/70 px-3 py-3">
                  <Portrait
                    name={tutor.name}
                    src={portraitFor(item.booking.tutor.slug, tutor.imageUrl, tutor.name)}
                    className="h-11 w-11 shrink-0 rounded-full text-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Tutor</p>
                    <p className="truncate text-sm font-medium text-navy">{tutor.name}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Split label="Tutor share" value={money(item.tutorShareCents)} />
                <Split label="Platform" value={money(item.platformShareCents)} />
                <Split label="Card fee" value={money(item.stripeFeeCents)} />
                <Split label="Net" value={money(item.netPlatformCents)} emphasize />
              </div>
            </article>
          );
        })}

        {!visible.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-serif text-2xl text-navy">No payments match</p>
            <p className="mt-2 text-sm text-mute">Try another filter or clear the search.</p>
            <Link href="/dashboard/admin/finance" className="btn btn-line mt-5">
              Clear filters
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 font-serif text-3xl text-navy">{value}</p>
    </article>
  );
}

function Split({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 ${emphasize ? "bg-navy/5" : "bg-mist/70"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${emphasize ? "text-navy" : "text-navy/80"}`}>{value}</p>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const styles = {
    good: "bg-navy/10 text-navy",
    warn: "bg-gold/20 text-deep",
    bad: "bg-[#8d3a32]/10 text-[#8d3a32]",
    neutral: "bg-mist text-mute",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}
