import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { universityFor } from "@/lib/universities";

export const dynamic = "force-dynamic";

const STATUS = {
  ASSIGNED: { label: "To do", tone: "bg-navy text-ivory", bar: "bg-navy", hint: "Assigned and waiting on you", progress: 33 },
  SUBMITTED: { label: "Submitted", tone: "bg-gold text-deep", bar: "bg-gold", hint: "Sent — awaiting tutor feedback", progress: 66 },
  REVIEWED: { label: "Reviewed", tone: "bg-cream text-navy border border-line", bar: "bg-gold", hint: "Feedback is ready", progress: 100 },
} as const;

type HomeworkStatus = keyof typeof STATUS;

function statusMeta(status: string) {
  return STATUS[status as HomeworkStatus] || STATUS.ASSIGNED;
}

function taskProgress(status: string) {
  return statusMeta(status).progress;
}

/** Parse values like "8/10", "80%", or "0.8" into 0–100. */
function metricPercent(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  const fraction = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const num = Number(fraction[1]);
    const den = Number(fraction[2]);
    if (den > 0) return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
  }
  const percent = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (percent) return Math.max(0, Math.min(100, Math.round(Number(percent[1]))));
  const decimal = Number(trimmed);
  if (!Number.isNaN(decimal)) {
    if (decimal >= 0 && decimal <= 1) return Math.round(decimal * 100);
    if (decimal > 1 && decimal <= 100) return Math.round(decimal);
  }
  return null;
}

export default async function StudentProgress() {
  const user = await requireUser();
  const db = await live();
  const studentId = user.studentProfile?.id || "";

  const [notes, reports, homework, assignments, completedSessions] = await Promise.all([
    db.progressNote.findMany({
      where: { studentId },
      include: { tutor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.sessionReport.findMany({
      where: { booking: { studentId } },
      include: { tutor: { include: { user: true } }, booking: true },
      orderBy: { createdAt: "desc" },
    }),
    db.homework.findMany({
      where: { studentId },
      include: { tutor: { include: { user: true } } },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    }),
    db.assignment.findMany({
      where: { studentId, status: "ACTIVE" },
      include: { tutor: { include: { user: true } } },
    }),
    db.booking.count({
      where: { studentId, type: "SESSION", status: "COMPLETED" },
    }),
  ]);

  const todo = homework.filter((item) => item.status === "ASSIGNED");
  const submitted = homework.filter((item) => item.status === "SUBMITTED");
  const reviewed = homework.filter((item) => item.status === "REVIEWED");
  const totalTasks = homework.length || 1;
  const doneShare = Math.round((reviewed.length / totalTasks) * 100);
  const activeTasks = [...todo, ...submitted];
  const goals = user.studentProfile?.goals?.trim();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Learning progress</p>
          <h1 className="mt-2 font-serif text-5xl">Progress</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            Track homework status, goals your tutors are measuring, and notes from completed sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/student/homework" className="btn btn-primary">
            Open homework
          </Link>
          <Link href="/dashboard/student/tutors" className="btn btn-line">
            My tutors
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="To do" value={String(todo.length)} detail="Assigned to you" />
        <Stat label="Submitted" value={String(submitted.length)} detail="Waiting on feedback" />
        <Stat label="Reviewed" value={String(reviewed.length)} detail="Completed with notes" />
        <Stat label="Sessions logged" value={String(completedSessions)} detail={`${reports.length} written report${reports.length === 1 ? "" : "s"}`} />
      </section>

      <section className="mt-4 card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Task status tracker</p>
            <p className="mt-1 text-xs text-mute">
              {homework.length
                ? `${reviewed.length} of ${homework.length} homework items reviewed (${doneShare}%)`
                : "Homework from your tutors will fill this tracker."}
            </p>
          </div>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-mist">
          {homework.length ? (
            <>
              <div className="bg-navy transition-all" style={{ width: `${(todo.length / homework.length) * 100}%` }} title="To do" />
              <div className="bg-gold transition-all" style={{ width: `${(submitted.length / homework.length) * 100}%` }} title="Submitted" />
              <div className="bg-cream transition-all" style={{ width: `${(reviewed.length / homework.length) * 100}%` }} title="Reviewed" />
            </>
          ) : (
            <div className="w-full bg-line/60" />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-mute">
          <Legend color="bg-navy" label="To do" />
          <Legend color="bg-gold" label="Submitted" />
          <Legend color="bg-cream border border-line" label="Reviewed" />
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-5">
          <p className="kicker">Your goals</p>
          <h2 className="mt-2 font-serif text-3xl">What you’re working toward</h2>
          <p className="mt-3 text-sm leading-7 text-mute">
            {goals || "No goals saved yet. Add them in Settings so your tutors can aim sessions at the right work."}
          </p>
          {!goals ? (
            <Link href="/dashboard/student/settings" className="btn btn-line mt-4">
              Add goals
            </Link>
          ) : null}
          {assignments.length ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Working with</p>
              <ul className="mt-2 space-y-2">
                {assignments.map((assignment) => (
                  <li key={assignment.id} className="text-sm">
                    <span className="font-medium">{assignment.tutor.user.name}</span>
                    <span className="text-mute"> · {universityFor(assignment.tutor.university).short}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="card p-5">
          <p className="kicker">Latest metrics</p>
          <h2 className="mt-2 font-serif text-3xl">Measured progress</h2>
          {notes.length ? (
            <div className="mt-4 space-y-3">
              {notes.slice(0, 3).map((note) => (
                <div key={note.id} className="rounded-xl border border-line bg-ivory px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                    {note.tutor.user.name} · {formatWhen(note.createdAt, user.timezone, false)}
                  </p>
                  {note.metricLabel ? (
                    <>
                      <p className="mt-2 font-serif text-2xl text-navy">
                        {note.metricValue}
                        <span className="ml-2 text-sm font-sans text-mute">{note.metricLabel}</span>
                      </p>
                      {metricPercent(note.metricValue) != null ? (
                        <ProgressBar value={metricPercent(note.metricValue)!} className="mt-3" label={`${metricPercent(note.metricValue)}%`} />
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-2 text-sm font-medium">{note.goal}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-mute">Your tutors can log metrics here after sessions — for example accuracy, timed-set scores, or writing targets.</p>
          )}
        </article>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">Task board</h2>
          <Link href="/dashboard/student/homework" className="text-sm text-mute hover:text-navy">
            All homework
          </Link>
        </div>
        {activeTasks.length || reviewed.length ? (
          <div className="grid gap-3">
            {[...activeTasks, ...reviewed.slice(0, 3)].map((item) => {
              const meta = statusMeta(item.status);
              const progress = taskProgress(item.status);
              const overdue = item.status === "ASSIGNED" && item.dueAt && item.dueAt.getTime() < Date.now();
              return (
                <article key={item.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${meta.tone}`}>
                          {meta.label}
                        </span>
                        {overdue ? (
                          <span className="rounded-full bg-[#8d3a32]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8d3a32]">
                            Overdue
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-serif text-2xl leading-tight">{item.title}</h3>
                      <p className="mt-1 text-sm text-mute">
                        {item.tutor.user.name}
                        {item.subject ? ` · ${item.subject}` : ""}
                        {item.dueAt ? ` · due ${formatWhen(item.dueAt, user.timezone, false)}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-mute">{item.description}</p>
                      <ProgressBar
                        value={progress}
                        className="mt-4"
                        label={`${progress}%`}
                        detail={
                          item.status === "ASSIGNED"
                            ? "Step 1 of 3 · Start the work"
                            : item.status === "SUBMITTED"
                              ? "Step 2 of 3 · Waiting for feedback"
                              : "Step 3 of 3 · Complete"
                        }
                        tone={item.status === "ASSIGNED" ? "navy" : "gold"}
                      />
                      {item.status === "REVIEWED" && item.feedback ? (
                        <p className="mt-3 rounded-xl bg-ivory px-3 py-2 text-sm leading-6">
                          <span className="font-medium">Feedback: </span>
                          {item.feedback}
                          {item.grade ? ` (${item.grade})` : ""}
                        </p>
                      ) : null}
                    </div>
                    <Link href="/dashboard/student/homework" className="btn btn-line shrink-0 whitespace-nowrap">
                      {item.status === "ASSIGNED" ? "Work on it" : item.status === "SUBMITTED" ? "View submission" : "View feedback"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-8 text-sm text-mute">
            No homework tasks yet. Once a tutor assigns work, it will show here as To do → Submitted → Reviewed.
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Goals & tutor notes</h2>
        <p className="mt-2 text-sm text-mute">Longer-term focus areas your tutors are tracking between sessions.</p>
        <div className="mt-4 grid gap-3">
          {notes.map((note) => {
            const percent = metricPercent(note.metricValue);
            return (
              <article key={note.id} className="card p-5">
                <p className="kicker">
                  {note.tutor.user.name} · {formatWhen(note.createdAt, user.timezone, false)}
                </p>
                <h3 className="mt-2 font-serif text-3xl leading-tight">{note.goal}</h3>
                <p className="mt-3 text-sm leading-7 text-mute">{note.note}</p>
                {note.metricLabel ? (
                  <div className="mt-4 rounded-xl border border-line bg-ivory px-3 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-serif text-2xl text-navy">{note.metricValue}</p>
                      <p className="text-sm text-mute">{note.metricLabel}</p>
                    </div>
                    {percent != null ? (
                      <ProgressBar value={percent} className="mt-3" label={`${percent}% of target`} tone="gold" />
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
          {!notes.length ? (
            <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-6 text-sm text-mute">
              Progress goals appear after your tutor records them.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Session feedback</h2>
        <p className="mt-2 text-sm text-mute">What was covered, how it went, and what to practice next.</p>
        <div className="mt-4 grid gap-3">
          {reports.map((report) => (
            <article key={report.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="kicker">
                    {report.tutor.user.name} · {formatWhen(report.booking.startsAt, user.timezone, false)}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-tight">{report.topics}</h3>
                </div>
                <span className="rounded-full border border-line bg-ivory px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy">
                  Session report
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Detail title="How it went" body={report.performance} />
                <Detail title="Focus next" body={report.improvements} />
                <Detail title="Practice" body={report.recommendations} />
              </div>
            </article>
          ))}
          {!reports.length ? (
            <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-6 text-sm text-mute">
              Session reports show up after a tutor completes a paid session and writes notes.
            </p>
          ) : null}
        </div>
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

function ProgressBar({
  value,
  label,
  detail,
  className = "",
  tone = "gold",
}: {
  value: number;
  label?: string;
  detail?: string;
  className?: string;
  tone?: "gold" | "navy";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-mute">{detail || "Progress"}</span>
        {label ? <span className="font-semibold text-navy">{label}</span> : null}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all ${tone === "navy" ? "bg-navy" : "bg-gold"}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Detail({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div className="rounded-xl border border-line bg-ivory px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-navy/90">{body}</p>
    </div>
  );
}
