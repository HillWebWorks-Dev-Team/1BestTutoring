"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { approveTutor, waitlistTutor } from "@/server/admin";
import { Spinner } from "@/components/ui/PageLoader";

type Decision = "approve" | "waitlist";

function ConfirmSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary whitespace-nowrap" disabled={pending} aria-busy={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          Working…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

export function ApplicationDecisionButtons({
  tutorId,
  tutorName,
}: {
  tutorId: string;
  tutorName: string;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);

  const copy =
    decision === "approve"
      ? {
          title: "Approve this tutor?",
          body: `${tutorName} will be marked approved and can appear in the directory once their profile is ready.`,
          confirm: "Confirm approve",
          action: approveTutor,
        }
      : decision === "waitlist"
        ? {
            title: "Waitlist this tutor?",
            body: `${tutorName} will be waitlisted. They can sign in later, but teaching tools stay closed.`,
            confirm: "Confirm waitlist",
            action: waitlistTutor,
          }
        : null;

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setDecision("approve")}>
          Approve
        </button>
        <button type="button" className="btn btn-line" onClick={() => setDecision("waitlist")}>
          Waitlist
        </button>
      </div>

      {copy ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="application-decision-title"
          aria-describedby="application-decision-body"
        >
          <div className="w-full max-w-md border border-line bg-white p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
            <p className="kicker">Application review</p>
            <h2 id="application-decision-title" className="mt-1 font-serif text-3xl text-navy">
              {copy.title}
            </h2>
            <p id="application-decision-body" className="mt-2 text-sm leading-6 text-mute">
              {copy.body}
            </p>
            <form action={copy.action} className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <input type="hidden" name="tutorId" value={tutorId} />
              <button type="button" className="btn btn-line whitespace-nowrap" onClick={() => setDecision(null)}>
                Cancel
              </button>
              <ConfirmSubmit label={copy.confirm} />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
