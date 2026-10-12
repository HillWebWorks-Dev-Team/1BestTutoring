"use client";

import { useActionState } from "react";
import { reportConcern } from "@/server/apply";
import { SubmitButton } from "@/components/ui";

export function ReportForm({ subjectUserId }: { subjectUserId?: string }) {
  const [state, action] = useActionState(reportConcern, null);
  if (state?.ok) return <p className="text-sm text-navy">Report received. An admin will review it.</p>;
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="subjectUserId" value={subjectUserId || ""} />
      <label className="label" htmlFor="reason">
        Reason
      </label>
      <select id="reason" className="field" name="reason">
        <option>Inappropriate message</option>
        <option>Safety of a minor</option>
        <option>Something else</option>
      </select>
      {state?.error ? <p className="text-sm text-[#7d332c]">{state.error}</p> : null}
      <textarea className="field min-h-16" name="details" placeholder="What happened?" />
      <SubmitButton className="btn btn-line w-fit !px-3 !py-1.5 text-xs" pendingLabel="Sending…">
        Send report
      </SubmitButton>
    </form>
  );
}
