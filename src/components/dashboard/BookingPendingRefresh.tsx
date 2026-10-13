"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/PageLoader";

export function BookingPendingRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 2500);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gold/35 bg-cream/50 px-4 py-3 text-sm text-navy">
      <Spinner className="h-4 w-4" />
      Confirming your payment and preparing Zoom… this page will update automatically.
    </div>
  );
}
