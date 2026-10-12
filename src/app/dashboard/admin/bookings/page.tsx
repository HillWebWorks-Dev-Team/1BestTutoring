import Link from "next/link";
import { Search } from "lucide-react";
import { Portrait } from "@/components/brand";
import { formatWhen, money } from "@/lib/format";
import { live } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";

export const dynamic = "force-dynamic";

type Filter = "all" | "upcoming" | "past" | "consultation" | "session" | "cancelled";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "consultation", label: "Consults" },
  { id: "session", label: "Sessions" },
  { id: "cancelled", label: "Cancelled" },
];

function statusTone(status: string): "good" | "warn" | "bad" | "neutral" {
  if (status === "COMPLETED" || status === "CONFIRMED") return "good";
  if (status === "CANCELLED" || status === "REFUNDED") return "bad";
  if (status === "PENDING_PAYMENT") return "warn";
  return "neutral";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const filter = (FILTERS.some((item) => item.id === params.filter) ? params.filter : "all") as Filter;
  const db = await live();
  const now = new Date();

  const bookings = await db.booking.findMany({
    include: {
      student: { include: { user: true } },
      tutor: { include: { user: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 120,
  });

  const visible = bookings.filter((booking) => {
    if (q) {
      const haystack = `${booking.student.user.name} ${booking.tutor.user.name} ${booking.student.user.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filter === "upcoming") return booking.startsAt >= now && !["CANCELLED", "REFUNDED"].includes(booking.status);
    if (filter === "past") return booking.startsAt < now || booking.status === "COMPLETED";
    if (filter === "consultation") return booking.type === "CONSULTATION";
    if (filter === "session") return booking.type === "SESSION";
    if (filter === "cancelled") return ["CANCELLED", "REFUNDED"].includes(booking.status);
    return true;
  });

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter((b) => b.startsAt >= now && !["CANCELLED", "REFUNDED"].includes(b.status)).length,
    past: bookings.filter((b) => b.startsAt < now || b.status === "COMPLETED").length,
    consultation: bookings.filter((b) => b.type === "CONSULTATION").length,
    session: bookings.filter((b) => b.type === "SESSION").length,
    cancelled: bookings.filter((b) => ["CANCELLED", "REFUNDED"].includes(b.status)).length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="kicker">Operations</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-navy">Sessions</h1>
          <p className="mt-2 text-sm text-mute">
            {counts.upcoming} upcoming · {counts.consultation} consults · {counts.session} paid sessions
          </p>
        </div>
        <Link href="/dashboard/admin/finance" className="btn btn-line">
          Open payments
        </Link>
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
              defaultValue={params.q || ""}
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
                ? "/dashboard/admin/bookings"
                : `/dashboard/admin/bookings?filter=${item.id}${q ? `&q=${encodeURIComponent(params.q || "")}` : ""}`;
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
        {visible.map((booking) => {
          const student = booking.student.user;
          const tutor = booking.tutor.user;
          const upcoming = booking.startsAt >= now && !["CANCELLED", "REFUNDED"].includes(booking.status);
          return (
            <article key={booking.id} className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-2xl leading-none text-navy">{formatWhen(booking.startsAt)}</p>
                    <Badge tone={booking.type === "CONSULTATION" ? "neutral" : "good"}>
                      {booking.type === "CONSULTATION" ? "Consultation" : "Session"}
                    </Badge>
                    <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
                    {upcoming ? <Badge tone="warn">Upcoming</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-mute">
                    {booking.priceCents ? money(booking.priceCents) : "Free"}
                    {booking.durationMin ? ` · ${booking.durationMin} min` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <PersonRow
                  label="Student"
                  name={student.name}
                  detail={student.email}
                  src={portraitFor(student.email, student.imageUrl, student.name)}
                />
                <PersonRow
                  label="Tutor"
                  name={tutor.name}
                  detail={booking.tutor.university}
                  src={portraitFor(booking.tutor.slug, tutor.imageUrl, tutor.name)}
                  href={`/tutors/${booking.tutor.slug}`}
                />
              </div>

              {booking.cancelReason ? (
                <p className="mt-3 text-xs text-mute">Note: {booking.cancelReason}</p>
              ) : null}
            </article>
          );
        })}

        {!visible.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-serif text-2xl text-navy">No bookings match</p>
            <p className="mt-2 text-sm text-mute">Try another filter or clear the search.</p>
            <Link href="/dashboard/admin/bookings" className="btn btn-line mt-5">
              Clear filters
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PersonRow({
  label,
  name,
  detail,
  src,
  href,
}: {
  label: string;
  name: string;
  detail: string;
  src?: string | null;
  href?: string;
}) {
  const content = (
    <>
      <Portrait name={name} src={src} className="h-11 w-11 shrink-0 rounded-full text-sm" />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-mute">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-medium text-navy">{name}</span>
        <span className="block truncate text-xs text-mute">{detail}</span>
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="flex items-center gap-3 rounded-2xl bg-ivory/70 px-3 py-3 transition hover:bg-ivory">
        {content}
      </Link>
    );
  }
  return <div className="flex items-center gap-3 rounded-2xl bg-ivory/70 px-3 py-3">{content}</div>;
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
