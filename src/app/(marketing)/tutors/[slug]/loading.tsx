export default function TutorProfileLoading() {
  return (
    <div className="bg-ivory" aria-busy="true" aria-live="polite">
      <section className="border-b border-line bg-white">
        <div className="shell grid gap-8 py-10 md:grid-cols-[200px_1fr] md:py-14">
          <div className="mx-auto h-48 w-48 animate-pulse rounded-2xl bg-mist md:mx-0 md:h-56 md:w-56" />
          <div className="space-y-4">
            <div className="h-3 w-20 animate-pulse rounded bg-line" />
            <div className="h-12 max-w-md animate-pulse rounded bg-line" />
            <div className="h-4 w-48 animate-pulse rounded bg-mist" />
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="h-11 w-40 animate-pulse rounded-lg bg-gold/30" />
              <div className="h-11 w-36 animate-pulse rounded-lg bg-line" />
            </div>
          </div>
        </div>
      </section>
      <section className="shell grid gap-6 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card space-y-3 p-5">
              <div className="h-5 w-32 animate-pulse rounded bg-line" />
              <div className="h-4 w-full animate-pulse rounded bg-mist" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-mist" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-mist" />
            </div>
          ))}
        </div>
        <div className="card h-64 animate-pulse bg-mist p-5" />
      </section>
      <p className="sr-only">Loading tutor profile…</p>
    </div>
  );
}
