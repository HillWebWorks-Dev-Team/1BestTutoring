"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/PageLoader";

function bookingCopy(url: URL) {
  const type = url.searchParams.get("type");
  const reschedule = url.searchParams.get("reschedule");
  if (reschedule) {
    return {
      title: "Opening reschedule…",
      body: "Loading open times so you can pick a new slot.",
      steps: ["Checking your booking", "Loading tutor availability", "Opening the calendar"],
    };
  }
  if (type === "session") {
    return {
      title: "Opening paid session booking…",
      body: "Preparing this tutor’s calendar and session pricing.",
      steps: ["Loading tutor calendar", "Checking open session times", "Ready to book"],
    };
  }
  return {
    title: "Opening free consultation…",
    body: "Preparing this tutor’s calendar for a 15-minute intro.",
    steps: ["Loading tutor calendar", "Checking open consult times", "Ready to book"],
  };
}

function isBookingPath(url: URL) {
  return /\/tutors\/[^/]+\/book\/?$/.test(url.pathname);
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [barVisible, setBarVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [modal, setModal] = useState<{ title: string; body: string; steps: string[]; step: number } | null>(null);
  const hideTimer = useRef<number | null>(null);
  const stepTimers = useRef<number[]>([]);
  const key = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.getAttribute("aria-disabled") === "true") return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      stepTimers.current.forEach((timer) => window.clearTimeout(timer));
      stepTimers.current = [];

      setBarVisible(true);
      setWidth(18);
      window.requestAnimationFrame(() => setWidth(72));

      if (isBookingPath(url)) {
        const copy = bookingCopy(url);
        setModal({ ...copy, step: 0 });
        document.body.style.overflow = "hidden";
        stepTimers.current = [
          window.setTimeout(() => setModal((current) => (current ? { ...current, step: 1 } : current)), 700),
          window.setTimeout(() => setModal((current) => (current ? { ...current, step: 2 } : current)), 1400),
        ];
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!barVisible && !modal) return;
    setWidth(100);
    stepTimers.current.forEach((timer) => window.clearTimeout(timer));
    stepTimers.current = [];
    hideTimer.current = window.setTimeout(() => {
      setBarVisible(false);
      setWidth(0);
      setModal(null);
      document.body.style.overflow = "";
    }, 220);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // Complete when the destination route finishes rendering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <>
      {barVisible || width > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden" aria-hidden>
          <div
            className="h-full bg-gold shadow-[0_0_12px_rgba(217,164,65,0.65)] transition-[width,opacity] duration-300 ease-out"
            style={{ width: `${width}%`, opacity: barVisible ? 1 : 0 }}
          />
        </div>
      ) : null}

      {modal ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="booking-loading-title"
          aria-busy="true"
        >
          <div className="card w-full max-w-md p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-mist">
                <Spinner className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="kicker">Booking</p>
                <h2 id="booking-loading-title" className="mt-1 font-serif text-3xl text-navy">
                  {modal.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-mute">{modal.body}</p>
              </div>
            </div>
            <ol className="mt-6 space-y-3">
              {modal.steps.map((item, index) => {
                const active = index === modal.step;
                const done = index < modal.step;
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
