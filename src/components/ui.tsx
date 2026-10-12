"use client";

import { useFormStatus } from "react-dom";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Notice({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${
        error ? "border-[#e7c7c2] bg-[#fbf1ef] text-[#7d332c]" : "border-gold/35 bg-cream/40 text-navy"
      }`}
    >
      {error || success}
    </p>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-serif text-3xl text-navy">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-mute">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-gold" aria-label={`${value} out of 5`}>
      {"★★★★★".slice(0, Math.round(value))}
      <span className="text-line">{"★★★★★".slice(Math.round(value))}</span>
    </span>
  );
}
