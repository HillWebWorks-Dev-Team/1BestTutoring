export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-3 w-24 rounded bg-line" />
      <div className="mt-4 h-12 w-80 max-w-full rounded bg-line" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-24 rounded-3xl border border-line bg-paper" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-64 rounded-3xl border border-line bg-paper" />
        <div className="h-64 rounded-3xl border border-line bg-paper" />
      </div>
    </div>
  );
}
