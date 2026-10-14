/** Prefer section-level Suspense on pages; keep this fallback light for route transitions. */
export default function MarketingLoading() {
  return <div className="min-h-[40vh] bg-ivory" aria-hidden />;
}
