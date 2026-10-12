"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { submitHomework } from "@/server/learning";

export type HomeworkCardItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: string;
  materialText: string;
  submissionText: string;
  feedback: string;
  grade: string | null;
  dueLabel: string | null;
  submittedLabel: string | null;
  reviewedLabel: string | null;
  tutorName: string;
  overdue: boolean;
};

const STATUS = {
  ASSIGNED: {
    label: "To do",
    tone: "bg-navy text-ivory",
    progress: 33,
    hint: "Start the work, then submit when ready.",
  },
  SUBMITTED: {
    label: "Submitted",
    tone: "bg-gold text-deep",
    progress: 66,
    hint: "Your tutor has your submission and will leave feedback.",
  },
  REVIEWED: {
    label: "Reviewed",
    tone: "bg-cream text-navy border border-line",
    progress: 100,
    hint: "Feedback is ready. Read it before the next session.",
  },
} as const;

type StatusKey = keyof typeof STATUS;

function meta(status: string) {
  return STATUS[status as StatusKey] || STATUS.ASSIGNED;
}

export function HomeworkBoard({
  items,
  initialId,
  filter,
}: {
  items: HomeworkCardItem[];
  initialId?: string;
  filter: "ALL" | "ASSIGNED" | "SUBMITTED" | "REVIEWED";
}) {
  const [openId, setOpenId] = useState<string | null>(initialId || null);

  const visible = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );

  if (!visible.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-10 text-center text-sm text-mute">
        {items.length ? "No homework in this filter. Try All." : "No homework yet. Assignments from your tutors will appear here."}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((item) => {
        const status = meta(item.status);
        const open = openId === item.id;
        return (
          <article key={item.id} className={`card overflow-hidden transition ${open ? "border-gold/40" : "hover:border-gold/35"}`}>
            <button
              type="button"
              className="w-full px-5 py-4 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              aria-controls={`homework-detail-${item.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.tone}`}>
                      {status.label}
                    </span>
                    {item.overdue ? (
                      <span className="rounded-full bg-[#8d3a32]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8d3a32]">
                        Overdue
                      </span>
                    ) : null}
                    {item.subject ? (
                      <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-mute">
                        {item.subject}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-serif text-2xl leading-tight md:text-3xl">{item.title}</h2>
                  <p className="mt-1 text-sm text-mute">
                    {item.tutorName}
                    {item.dueLabel ? ` · due ${item.dueLabel}` : ""}
                  </p>
                  {!open ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-mute">{item.description}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs font-semibold text-navy">{status.progress}%</span>
                  <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-navy">
                    {open ? "Hide details" : "View details"}
                  </span>
                </div>
              </div>
              {!open ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist">
                  <div
                    className={`h-full rounded-full ${item.status === "ASSIGNED" ? "bg-navy" : "bg-gold"}`}
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              ) : null}
            </button>

            {open ? (
              <div id={`homework-detail-${item.id}`} className="border-t border-line px-5 py-5">
                <p className="text-sm leading-7 text-mute">{item.description}</p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-mute">{status.hint}</span>
                    <span className="font-semibold text-navy">{status.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={`h-full rounded-full ${item.status === "ASSIGNED" ? "bg-navy" : "bg-gold"}`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>

                {item.materialText ? (
                  <div className="mt-4 rounded-xl border border-line bg-ivory px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">Materials</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-navy/90">{item.materialText}</p>
                  </div>
                ) : null}

                {item.submissionText ? (
                  <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">Your submission</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.submissionText}</p>
                    {item.submittedLabel ? <p className="mt-2 text-xs text-mute">Submitted {item.submittedLabel}</p> : null}
                  </div>
                ) : null}

                {item.status === "REVIEWED" && item.feedback ? (
                  <div className="mt-4 rounded-xl border border-gold/35 bg-gold/10 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">Tutor feedback</p>
                      {item.grade ? (
                        <span className="rounded-full bg-navy px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ivory">
                          {item.grade}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-navy">{item.feedback}</p>
                    {item.reviewedLabel ? <p className="mt-2 text-xs text-mute">Reviewed {item.reviewedLabel}</p> : null}
                  </div>
                ) : null}

                {item.status !== "REVIEWED" ? (
                  <form action={submitHomework} className="mt-5 grid gap-3 rounded-xl border border-line bg-ivory p-4">
                    <input type="hidden" name="homeworkId" value={item.id} />
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {item.status === "SUBMITTED" ? "Update submission" : "Submit your work"}
                      </p>
                      <label className="label mt-3" htmlFor={`work-${item.id}`}>
                        Your answer
                      </label>
                      <textarea
                        id={`work-${item.id}`}
                        className="field min-h-28"
                        name="submissionText"
                        placeholder="Paste your work, upload notes as text, or summarize what you completed."
                        defaultValue={item.submissionText}
                        required
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn btn-primary" type="submit">
                        {item.status === "SUBMITTED" ? "Resubmit" : "Submit homework"}
                      </button>
                      <p className="text-xs text-mute">Your tutor is notified as soon as you submit.</p>
                    </div>
                  </form>
                ) : (
                  <div className="mt-5">
                    <Link href="/dashboard/student/progress" className="btn btn-line">
                      See progress notes
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
