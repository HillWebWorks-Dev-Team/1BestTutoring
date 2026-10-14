"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "@/server/auth";
import { Spinner } from "@/components/ui/PageLoader";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    if (!pending) {
      setProgress(18);
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    setProgress(28);
    const timers = [
      window.setTimeout(() => setProgress(52), 200),
      window.setTimeout(() => setProgress(74), 600),
      window.setTimeout(() => setProgress(88), 1200),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.style.overflow = "";
    };
  }, [pending]);

  return (
    <>
      <form action={action} className="grid gap-5" aria-busy={pending}>
        <input type="hidden" name="next" value={next || "/dashboard"} />
        {state?.error ? (
          <p id="login-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#7d332c]">
            {state.error}
          </p>
        ) : null}
        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="field h-12"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={state?.error ? "login-error" : undefined}
            required
            disabled={pending}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              className="field h-12 pr-12"
              name="password"
              type={visible ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-describedby={state?.error ? "login-error" : undefined}
              required
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              aria-controls="password"
              disabled={pending}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-mute hover:text-navy"
            >
              {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary mt-1 h-12 w-full">
          {pending ? "Signing in…" : "Log in"}
          {!pending ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
        </button>
      </form>

      {pending ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="login-loading-title"
          aria-busy="true"
        >
          <div className="w-full max-w-md border border-line bg-white p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-mist">
                <Spinner className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="kicker">Account</p>
                <h2 id="login-loading-title" className="mt-1 font-serif text-3xl text-navy">
                  Signing you in
                </h2>
                <p className="mt-2 text-sm leading-6 text-mute">
                  Hang tight - checking your account. Don’t close this tab.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-mute">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
