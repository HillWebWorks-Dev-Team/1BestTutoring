"use client";

import { useActionState } from "react";
import { login } from "@/server/auth";
import { SubmitButton } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next || "/dashboard"} />
      {state?.error ? <p className="text-sm text-[#7d332c]">{state.error}</p> : null}
      <label className="label" htmlFor="email">Email</label>
      <input id="email" className="field" name="email" type="email" autoComplete="email" required />
      <label className="label" htmlFor="password">Password</label>
      <input id="password" className="field" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pendingLabel="Signing in…">Log in</SubmitButton>
    </form>
  );
}
