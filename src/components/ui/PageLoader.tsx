export function Spinner({
  className = "h-8 w-8",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 ${
        light ? "border-ivory/25 border-t-ivory" : "border-navy/15 border-t-navy"
      } ${className}`}
      aria-hidden
    />
  );
}

export function PageLoader({
  label = "Loading…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center ${compact ? "min-h-[40vh] py-10" : "min-h-[60vh] px-5 py-16"}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className={compact ? "h-7 w-7" : "h-9 w-9"} />
        <div>
          <p className="font-serif text-2xl text-navy">{label}</p>
          <p className="mt-1 text-sm text-mute">Just a moment</p>
        </div>
      </div>
    </div>
  );
}
