export default function TutorsLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <section className="bg-deep text-ivory">
        <div className="shell py-14 md:py-16">
          <div className="h-3 w-28 animate-pulse rounded bg-ivory/20" />
          <div className="mt-4 h-12 max-w-md animate-pulse rounded bg-ivory/25 md:h-14" />
          <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-ivory/15" />
          <div className="mt-2 h-4 max-w-lg animate-pulse rounded bg-ivory/10" />
        </div>
      </section>

      <section className="bg-ivory py-10">
        <div className="shell grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 border border-line bg-white p-5">
              <div className="h-7 w-24 animate-pulse rounded bg-line" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-line/80" />
                    <div className="h-11 w-full animate-pulse rounded-lg bg-mist" />
                  </div>
                ))}
                <div className="h-11 w-full animate-pulse rounded-lg bg-gold/30" />
              </div>
            </div>
          </aside>

          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-line" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="card overflow-hidden">
                  <div className="aspect-[4/5] w-full animate-pulse bg-mist" />
                  <div className="space-y-3 px-4 py-4">
                    <div className="h-6 w-2/3 animate-pulse rounded bg-line" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-line/80" />
                    <div className="h-4 w-full animate-pulse rounded bg-mist" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-line" />
                      <div className="h-9 w-24 animate-pulse rounded-lg bg-gold/25" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="sr-only">Loading tutors…</p>
          </div>
        </div>
      </section>
    </div>
  );
}
