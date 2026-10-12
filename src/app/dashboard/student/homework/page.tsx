import Link from "next/link";
import { HomeworkBoard, type HomeworkCardItem } from "@/components/dashboard/HomeworkBoard";
import { Notice } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudentHomework({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string; status?: string; id?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const studentId = user.studentProfile?.id || "";
  const items = await db.homework.findMany({
    where: { studentId },
    include: { tutor: { include: { user: true } } },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });

  const todo = items.filter((item) => item.status === "ASSIGNED");
  const submitted = items.filter((item) => item.status === "SUBMITTED");
  const reviewed = items.filter((item) => item.status === "REVIEWED");
  const filter =
    query.status === "ASSIGNED" || query.status === "SUBMITTED" || query.status === "REVIEWED" ? query.status : "ALL";

  const cards: HomeworkCardItem[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    subject: item.subject,
    status: item.status,
    materialText: item.materialText,
    submissionText: item.submissionText,
    feedback: item.feedback,
    grade: item.grade,
    dueLabel: item.dueAt ? formatWhen(item.dueAt, user.timezone, false) : null,
    submittedLabel: item.submittedAt ? formatWhen(item.submittedAt, user.timezone) : null,
    reviewedLabel: item.reviewedAt ? formatWhen(item.reviewedAt, user.timezone, false) : null,
    tutorName: item.tutor.user.name,
    overdue: item.status === "ASSIGNED" && Boolean(item.dueAt && item.dueAt.getTime() < Date.now()),
  }));

  const initialId =
    query.id && cards.some((item) => item.id === query.id)
      ? query.id
      : query.submitted
        ? cards.find((item) => item.status === "SUBMITTED")?.id
        : cards.find((item) => item.status === "ASSIGNED")?.id;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Assignments</p>
          <h1 className="mt-2 font-serif text-5xl">Homework</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
            Click a card to open instructions, materials, and submission. Collapse it when you are done.
          </p>
        </div>
        <Link href="/dashboard/student/progress" className="btn btn-line">
          View progress
        </Link>
      </div>

      <div className="mt-4">
        <Notice error={query.error} success={query.submitted ? "Submitted. Your tutor will review it next." : undefined} />
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="To do" value={String(todo.length)} detail="Waiting on you" />
        <Stat label="Submitted" value={String(submitted.length)} detail="Awaiting feedback" />
        <Stat label="Reviewed" value={String(reviewed.length)} detail="Feedback ready" />
      </section>

      {items.length ? (
        <section className="card mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Status tracker</p>
            <p className="text-xs text-mute">
              {reviewed.length} of {items.length} reviewed
            </p>
          </div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-mist">
            <div className="bg-navy" style={{ width: `${(todo.length / items.length) * 100}%` }} />
            <div className="bg-gold" style={{ width: `${(submitted.length / items.length) * 100}%` }} />
            <div className="bg-cream" style={{ width: `${(reviewed.length / items.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["ALL", "All"],
              ["ASSIGNED", "To do"],
              ["SUBMITTED", "Submitted"],
              ["REVIEWED", "Reviewed"],
            ].map(([value, label]) => {
              const active = filter === value;
              const href =
                value === "ALL"
                  ? "/dashboard/student/homework"
                  : `/dashboard/student/homework?status=${value}`;
              return (
                <Link
                  key={value}
                  href={href}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active ? "bg-navy text-ivory" : "border border-line bg-paper text-navy hover:border-gold/50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <HomeworkBoard items={cards} filter={filter} initialId={initialId} />
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
      <p className="mt-1 text-xs text-mute">{detail}</p>
    </article>
  );
}
