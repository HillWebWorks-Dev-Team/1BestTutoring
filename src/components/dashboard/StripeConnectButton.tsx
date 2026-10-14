"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { startStripeConnect } from "@/server/tutor";

const STEPS = [
  "Creating your Stripe Express account…",
  "Applying platform payout settings…",
  "Opening Stripe’s secure onboarding…",
];

function ConnectSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!pending) {
      setStep(0);
      return;
    }
    setStep(0);
    const timers = [
      window.setTimeout(() => setStep(1), 900),
      window.setTimeout(() => setStep(2), 1800),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [pending]);

  return (
    <>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Connecting…" : label}
      </button>

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]" role="alertdialog" aria-modal="true" aria-labelledby="stripe-connect-title" aria-busy="true">
          <div className="card w-full max-w-md p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-mist">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/15 border-t-navy" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="kicker">Stripe Connect</p>
                <h2 id="stripe-connect-title" className="mt-1 font-serif text-3xl text-navy">
                  Setting up payouts
                </h2>
                <p className="mt-2 text-sm leading-6 text-mute">
                  Hang tight - we’ll send you to Stripe to finish identity and banking details. Don’t close this tab.
                </p>
              </div>
            </div>

            <ol className="mt-6 space-y-3">
              {STEPS.map((item, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <li
                    key={item}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      active
                        ? "border-gold/50 bg-gold/10 text-navy"
                        : done
                          ? "border-line bg-mist text-navy"
                          : "border-transparent text-mute"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        done ? "bg-navy text-ivory" : active ? "bg-gold text-deep" : "bg-line text-mute"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span className={active ? "font-medium" : ""}>{item}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function StripeConnectButton({
  label,
}: {
  label: string;
}) {
  return (
    <form action={startStripeConnect} className="mt-6">
      <ConnectSubmit label={label} />
    </form>
  );
}
