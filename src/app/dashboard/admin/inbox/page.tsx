import Link from "next/link";
import { Mail, Search } from "lucide-react";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { handleContact } from "@/server/admin";

export const dynamic = "force-dynamic";

type Filter = "all" | "open" | "handled";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "handled", label: "Handled" },
];

function topicLabel(topic: string) {
  return topic.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const filter = (FILTERS.some((item) => item.id === params.filter) ? params.filter : "open") as Filter;
  const db = await live();
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  const visible = messages.filter((message) => {
    if (filter === "open" && message.handled) return false;
    if (filter === "handled" && !message.handled) return false;
    if (!q) return true;
    const haystack = `${message.name} ${message.email} ${message.topic} ${message.message}`.toLowerCase();
    return haystack.includes(q);
  });

  const counts = {
    all: messages.length,
    open: messages.filter((message) => !message.handled).length,
    handled: messages.filter((message) => message.handled).length,
  };

  return (
    <div className="mx-auto max-w-5xl">
      <p className="kicker">Support</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-navy">Inbox</h1>
          <p className="mt-2 text-sm text-mute">
            {counts.open} open · {counts.handled} handled · contact form messages
          </p>
        </div>
        <Link href="/dashboard/admin/safety" className="btn btn-line">
          Safety reports
        </Link>
      </div>

      <div className="my-5">
        <Notice success={params.updated ? "Message marked as handled." : undefined} />
      </div>

      <div className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="filter" value={filter} />
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input
              className="field !pl-10"
              name="q"
              placeholder="Search name, email, topic, or message"
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
              item.id === "open" && !q
                ? "/dashboard/admin/inbox"
                : `/dashboard/admin/inbox?filter=${item.id}${q ? `&q=${encodeURIComponent(params.q || "")}` : ""}`;
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
        {visible.map((message) => (
          <article
            key={message.id}
            className={`rounded-3xl border bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5 ${
              message.handled ? "border-line opacity-90" : "border-gold/35"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Portrait name={message.name} className="h-12 w-12 shrink-0 rounded-full text-sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-serif text-2xl leading-none text-navy">{message.name}</h2>
                    <Badge tone={message.handled ? "neutral" : "warn"}>
                      {message.handled ? "Handled" : "Open"}
                    </Badge>
                    <Badge tone="neutral">{topicLabel(message.topic)}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-mute">
                    <a className="underline-offset-2 hover:underline" href={`mailto:${message.email}`}>
                      {message.email}
                    </a>
                    <span> · {formatWhen(message.createdAt)}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(topicLabel(message.topic))}`} className="btn btn-line !px-3 !py-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Reply
                </a>
                {!message.handled ? (
                  <form action={handleContact}>
                    <input type="hidden" name="id" value={message.id} />
                    <button className="btn btn-primary !px-3 !py-1.5 text-xs" type="submit">
                      Mark handled
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-ivory/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Message</p>
              <p className="mt-1.5 text-sm leading-6 text-navy whitespace-pre-wrap">{message.message}</p>
            </div>
          </article>
        ))}

        {!visible.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-14 text-center">
            <Mail className="mx-auto h-8 w-8 text-line" aria-hidden />
            <p className="mt-3 font-serif text-2xl text-navy">
              {filter === "open" && !q ? "Inbox is clear" : "No messages match"}
            </p>
            <p className="mt-2 text-sm text-mute">
              {filter === "open" && !q
                ? "New contact-form messages will show up here."
                : "Try another filter or clear the search."}
            </p>
            {filter !== "open" || q ? (
              <Link href="/dashboard/admin/inbox" className="btn btn-line mt-5">
                Show open messages
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
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
