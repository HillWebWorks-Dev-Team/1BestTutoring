"use client";

import { useActionState } from "react";
import { register } from "@/server/auth";
import { GRADE_LEVELS, TIMEZONES } from "@/lib/brand";
import { SubmitButton } from "@/components/ui";

export function RegisterForm({ referral }: { referral?: string }) {
  const [state, action] = useActionState(register, null);
  return (
    <form action={action} className="grid gap-4">
      {state?.error ? <p className="text-sm text-[#7d332c]">{state.error}</p> : null}
      <label className="label">I am</label>
      <div className="flex gap-4 text-sm">
        <label><input type="radio" name="role" value="STUDENT" defaultChecked /> Student</label>
        <label><input type="radio" name="role" value="PARENT" /> Parent</label>
      </div>
      <label className="label" htmlFor="name">Full name</label>
      <input id="name" className="field" name="name" required />
      <label className="label" htmlFor="email">Email</label>
      <input id="email" className="field" name="email" type="email" required />
      <label className="label" htmlFor="password">Password</label>
      <input id="password" className="field" name="password" type="password" minLength={8} required />
      <label className="label" htmlFor="gradeLevel">Grade level</label>
      <select id="gradeLevel" className="field" name="gradeLevel" defaultValue="High School">
        {GRADE_LEVELS.map((level) => (
          <option key={level}>{level}</option>
        ))}
      </select>
      <label className="label" htmlFor="timezone">Time zone</label>
      <select id="timezone" className="field" name="timezone" defaultValue="America/New_York">
        {TIMEZONES.map((zone) => (
          <option key={zone}>{zone}</option>
        ))}
      </select>
      <label className="label" htmlFor="guardianEmail">Guardian email, if the student is a minor</label>
      <input id="guardianEmail" className="field" name="guardianEmail" type="email" />
      <label className="label" htmlFor="referral">Referral code</label>
      <input id="referral" className="field" name="referral" defaultValue={referral || ""} />
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
