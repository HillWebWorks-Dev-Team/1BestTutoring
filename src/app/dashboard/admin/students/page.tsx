import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { live } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";
import { adminLinkParent } from "@/server/admin";

export const dynamic = "force-dynamic";

type Filter = "all" | "matched" | "unmatched" | "minors" | "no-parent";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "matched", label: "Matched" },
  { id: "unmatched", label: "Needs tutor" },
  { id: "minors", label: "Minors" },
  { id: "no-parent", label: "No parent link" },
];

export default async function AdminStudents({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; error?: string; linked?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const filter = (FILTERS.some((item) => item.id === params.filter) ? params.filter : "all") as Filter;
  const db = await live();

  const [students, parents, pendingRequests] = await Promise.all([
    db.studentProfile.findMany({
      where: q
        ? {
            user: {
              OR: [{ name: { contains: q } }, { email: { contains: q } }],
            },
          }
        : undefined,
      include: {
        user: true,
        parent: { include: { user: true } },
        assignments: {
          where: { status: "ACTIVE" },
          include: { tutor: { include: { user: true } } },
        },
        requests: {
          where: { status: "PENDING" },
          include: { tutor: { include: { user: true } } },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    db.parentProfile.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
    db.tutoringRequest.count({ where: { status: "PENDING" } }),
  ]);

  const visible = students.filter((student) => {
    const matched = student.assignments.length > 0;
    const hasParent = Boolean(student.parentId);
    if (filter === "matched") return matched;
    if (filter === "unmatched") return !matched;
    if (filter === "minors") return student.isMinor;
    if (filter === "no-parent") return !hasParent;
    return true;
  });

  const counts = {
    all: students.length,
    matched: students.filter((student) => student.assignments.length > 0).length,
    unmatched: students.filter((student) => student.assignments.length === 0).length,
    minors: students.filter((student) => student.isMinor).length,
    "no-parent": students.filter((student) => !student.parentId).length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="kicker">Directory</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-navy">Students</h1>
          <p className="mt-2 text-sm text-mute">
            {counts.matched} matched · {counts.unmatched} need a tutor · {pendingRequests} open request
            {pendingRequests === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/dashboard/admin/assignments" className="btn btn-line">
          Open matching
        </Link>
      </div>

      <div className="my-5">
        <Notice
          error={params.error}
          success={params.linked ? "Parent linked to student." : undefined}
        />
      </div>

      <div className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="filter" value={filter} />
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
            <input
              className="field !pl-10"
              name="q"
              placeholder="Search by name or email"
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
            const href =
              item.id === "all" && !q
                ? "/dashboard/admin/students"
                : `/dashboard/admin/students?filter=${item.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
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
        {visible.map((student) => {
          const matched = student.assignments.length > 0;
          const guardian = student.parent?.user;
          const pendingTutorNames = student.requests.map((request) => request.tutor.user.name);
          return (
            <article key={student.id} className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Portrait
                    name={student.user.name}
                    src={portraitFor(student.user.email, student.user.imageUrl, student.user.name)}
                    className="h-12 w-12 shrink-0 rounded-full text-sm"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-2xl leading-none text-navy">{student.user.name}</h2>
                    <p className="mt-1 truncate text-sm text-mute">{student.user.email}</p>
                    <p className="mt-1 text-sm text-navy/80">
                      {[student.gradeLevel || "Grade not set", student.school || null].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={matched ? "good" : "warn"}>{matched ? "Matched" : "Needs tutor"}</Badge>
                      {student.isMinor ? <Badge tone="warn">Minor</Badge> : <Badge tone="neutral">Adult</Badge>}
                      {guardian ? (
                        <Badge tone="good">Parent linked</Badge>
                      ) : student.guardianEmail ? (
                        <Badge tone="warn">Guardian email only</Badge>
                      ) : (
                        <Badge tone="neutral">No parent</Badge>
                      )}
                      {pendingTutorNames.length ? (
                        <Badge tone="warn">
                          {pendingTutorNames.length} request{pendingTutorNames.length === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {!matched ? (
                    <Link href="/dashboard/admin/assignments" className="btn btn-primary !px-3 !py-1.5 text-xs">
                      Match tutor
                    </Link>
                  ) : null}
                  {pendingTutorNames.length ? (
                    <Link href="/dashboard/admin/assignments" className="btn btn-line !px-3 !py-1.5 text-xs">
                      Review requests
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-ivory/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Goals</p>
                  <p className="mt-1 text-sm leading-6 text-navy">{student.goals || "No goals listed yet."}</p>
                  {student.subjectsNeeded ? (
                    <p className="mt-2 text-xs text-mute">Subjects: {student.subjectsNeeded}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-ivory/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Tutors</p>
                  {matched ? (
                    <ul className="mt-1 space-y-1">
                      {student.assignments.map((item) => (
                        <li key={item.id} className="text-sm text-navy">
                          {item.tutor.user.name}
                          <span className="text-mute"> · {item.tutor.university}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-mute">
                      {pendingTutorNames.length
                        ? `Waiting on: ${pendingTutorNames.join(", ")}`
                        : "No active assignment yet."}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-line px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Family</p>
                    {guardian ? (
                      <p className="mt-1 text-sm text-navy">
                        {guardian.name}
                        <span className="text-mute"> · {guardian.email}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-mute">
                        {student.guardianEmail
                          ? `Guardian contact on file: ${student.guardianEmail}`
                          : "No parent account linked."}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-mute">
                    <UserRound className="h-3.5 w-3.5" aria-hidden />
                    Referral {student.referralCode}
                  </span>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-navy hover:text-navy/80 [&::-webkit-details-marker]:hidden">
                    {guardian ? "Change parent link" : "Link a parent account"}
                  </summary>
                  <form action={adminLinkParent} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="hidden" name="studentId" value={student.id} />
                    <select className="field" name="parentId" required defaultValue="">
                      <option value="" disabled>
                        Choose parent…
                      </option>
                      {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.user.name} · {parent.user.email}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-line shrink-0" type="submit">
                      {guardian ? "Update link" : "Link parent"}
                    </button>
                  </form>
                </details>
              </div>
            </article>
          );
        })}

        {!visible.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-14 text-center">
            <p className="font-serif text-2xl text-navy">No students match</p>
            <p className="mt-2 text-sm text-mute">
              {q ? "Try a different search, or clear the filters." : "Nothing in this filter yet."}
            </p>
            <Link href="/dashboard/admin/students" className="btn btn-line mt-5">
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
