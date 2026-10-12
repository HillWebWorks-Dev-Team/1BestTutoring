"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="kicker">Admin</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Something went wrong</h1>
      <p className="mt-3 text-sm leading-6 text-mute">
        {error.message || "The admin desk could not load. Try again."}
      </p>
      <button className="btn btn-primary mt-6" type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
