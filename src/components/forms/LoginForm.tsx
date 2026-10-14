"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "@/server/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="grid gap-5" aria-busy={pending}>
      <input type="hidden" name="next" value={next || "/dashboard"} />
      {state?.error ? <p id="login-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#7d332c]">{state.error}</p> : null}
      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input id="email" className="field h-12" name="email" type="email" placeholder="you@example.com" autoComplete="username" autoCapitalize="none" spellCheck={false} aria-describedby={state?.error ? "login-error" : undefined} required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" className="field h-12 pr-12" name="password" type={visible ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" aria-describedby={state?.error ? "login-error" : undefined} required />
          <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} aria-controls="password" className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-mute hover:text-navy">
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary mt-1 h-12 w-full">
        {pending ? "Signing in…" : "Log in"}{!pending ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
      </button>
    </form>
  );
}
