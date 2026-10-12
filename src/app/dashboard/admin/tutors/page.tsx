import Link from "next/link";
import { CheckCircle2, CircleDashed, Search, ShieldAlert } from "lucide-react";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { hourly } from "@/lib/format";
import { live } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";
import { decideQualification, saveAdminTutorNotes, toggleTutorActive } from "@/server/admin";

export const dynamic = "force-dynamic";

type Filter = "all" | "active" | "inactive" | "pipeline" | "edits";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "pipeline", label: "In review" },
  { id: "edits", label: "Edits waiting" },
];

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function stripeLabel(tutor: { stripePayoutsEnabled: boolean; stripeAccountId: string | null }) {
  if (tutor.stripePayoutsEnabled) return "Ready";
  if (tutor.stripeAccountId) return "Started";
  return "Not started";
}

export default async function AdminTutors({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const filter = (FILTERS.some((item) => item.id === params.filter) ? params.filter : "all") as Filter;
  const db = await live();

  const tutors = await db.tutorProfile.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
            { university: { contains: q } },
          ],
        }
      : undefined,
    include: { user: true },
    orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
  });

  const visible = tutors.filter((tutor) => {
    if (filter === "active") return tutor.status === "APPROVED" && tutor.active;
    if (filter === "inactive") return tutor.status === "APPROVED" && !tutor.active;
    if (filter === "pipeline") return ["PENDING", "WAITLISTED", "MORE_INFO"].includes(tutor.status);
    if (filter === "edits") return Boolean(tutor.pendingChanges);
    return true;
  });

  const counts = {
    all: tutors.length,
    active: tutors.filter((tutor) => tutor.status === "APPROVED" && tutor.active).length,
    inactive: tutors.filter((tutor) => tutor.status === "APPROVED" && !tutor.active).length,
    pipeline: tutors.filter((tutor) => ["PENDING", "WAITLISTED", "MORE_INFO"].includes(tutor.status)).length,
    edits: tutors.filter((tutor) => tutor.pendingChanges).length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="kicker">Directory</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-navy">Tutors</h1>
          <p className="mt-2 text-sm text-mute">
            {counts.active} active · {counts.pipeline} in review · {counts.edits} with edits waiting
          </p>
        </div>
        <Link href="/dashboard/admin/applications" className="btn btn-line">
          Review applications
        </Link>
      </div>

      <div className="my-5">
        <Notice success={params.updated ? "Tutor roster updated." : undefined} />
      </div>

      <div className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="filter" value={filter} />
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input
              className="field !pl-10"
              name="q"
              placeholder="Search by name, email, or school"
              defaultValue={q}
            />
          </label>
          <button className="btn btn-primary shrink-0" type="submit">
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            const href = item.id === "all" && !q ? "/dashboard/admin/tutors" : `/dashboard/admin/tutors?filter=${item.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
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
        {visible.map((tutor) => {
          const approved = tutor.status === "APPROVED";
          const stripe = stripeLabel(tutor);
          const imageUrl = portraitFor(tutor.slug, tutor.user.imageUrl);
          return (
            <article key={tutor.id} className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Portrait name={tutor.user.name} src={imageUrl} className="h-12 w-12 shrink-0 rounded-full text-sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-serif text-2xl leading-none text-navy">{tutor.user.name}</h2>
                      {tutor.pendingChanges ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-deep">
                          <ShieldAlert className="h-3 w-3" aria-hidden />
                          Edits waiting
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-mute">{tutor.user.email}</p>
                    <p className="mt-1 text-sm text-navy/80">
                      {tutor.university}
                      {tutor.major ? ` · ${tutor.major}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        tone={
                          approved && tutor.active
                            ? "good"
                            : approved
                              ? "warn"
                              : tutor.status === "REJECTED"
                                ? "bad"
                                : "neutral"
                        }
                      >
                        {approved ? (tutor.active ? "Active" : "Inactive") : statusLabel(tutor.status)}
                      </Badge>
                      <Badge tone={stripe === "Ready" ? "good" : stripe === "Started" ? "warn" : "neutral"}>
                        Stripe · {stripe}
                      </Badge>
                      <Badge tone="neutral">{hourly(tutor.hourlyRateCents)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {approved ? (
                    <Link href={`/tutors/${tutor.slug}`} className="btn btn-line !px-3 !py-1.5 text-xs">
                      View profile
                    </Link>
                  ) : (
                    <Link href={`/dashboard/admin/applications/${tutor.id}`} className="btn btn-line !px-3 !py-1.5 text-xs">
                      Open application
                    </Link>
                  )}
                  {approved ? (
                    <form action={toggleTutorActive}>
                      <input type="hidden" name="tutorId" value={tutor.id} />
                      <button
                        className={`btn !px-3 !py-1.5 text-xs ${tutor.active ? "btn-line" : "btn-primary"}`}
                        type="submit"
                      >
                        {tutor.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              {tutor.pendingChanges ? (
                <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
                  <p className="text-sm font-medium text-navy">Qualification edits need a decision</p>
                  <p className="mt-1 text-xs text-mute">Approve to publish their proposed profile changes, or discard them.</p>
                  <form action={decideQualification} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="tutorId" value={tutor.id} />
                    <button className="btn btn-primary !px-3 !py-1.5 text-xs" name="decision" value="approve" type="submit">
                      Approve edits
                    </button>
                    <button className="btn btn-line !px-3 !py-1.5 text-xs" name="decision" value="discard" type="submit">
                      Discard
                    </button>
                  </form>
                </div>
              ) : null}

              <details className="mt-4 rounded-2xl border border-line bg-ivory/50 open:bg-ivory">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-navy [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    {tutor.adminNotes ? (
                      <CheckCircle2 className="h-4 w-4 text-gold" aria-hidden />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-mute" aria-hidden />
                    )}
                    Internal note
                    <span className="text-xs font-normal text-mute">
                      {tutor.adminNotes ? "· saved" : "· optional"}
                    </span>
                  </span>
                </summary>
                <form action={saveAdminTutorNotes} className="border-t border-line px-4 py-3">
                  <input type="hidden" name="tutorId" value={tutor.id} />
                  <label className="label" htmlFor={`note-${tutor.id}`}>
                    Visible only to admins
                  </label>
                  <textarea
                    id={`note-${tutor.id}`}
                    className="field min-h-20"
                    name="adminNotes"
                    defaultValue={tutor.adminNotes}
                    placeholder="Background checks, scheduling preferences, red flags…"
                  />
                  <button className="btn btn-line mt-3 !px-3 !py-1.5 text-xs" type="submit">
                    Save note
                  </button>
                </form>
              </details>
            </article>
          );
        })}

        {!visible.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-serif text-2xl text-navy">No tutors match</p>
            <p className="mt-2 text-sm text-mute">
              {q ? "Try a different search, or clear the filters." : "Nothing in this filter yet."}
            </p>
            <Link href="/dashboard/admin/tutors" className="btn btn-line mt-5">
              Clear filters
            </Link>
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
