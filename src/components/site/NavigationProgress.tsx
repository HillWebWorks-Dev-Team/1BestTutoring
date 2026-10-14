"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/PageLoader";

type LoadingModal = {
  kicker: string;
  title: string;
  body: string;
  steps?: string[];
  step: number;
};

function bookingCopy(url: URL): Omit<LoadingModal, "step"> {
  const type = url.searchParams.get("type");
  const reschedule = url.searchParams.get("reschedule");
  if (reschedule) {
    return {
      kicker: "Booking",
      title: "Opening reschedule…",
      body: "Loading open times so you can pick a new slot.",
      steps: ["Checking your booking", "Loading tutor availability", "Opening the calendar"],
    };
  }
  if (type === "session") {
    return {
      kicker: "Booking",
      title: "Opening paid session booking…",
      body: "Preparing this tutor’s calendar and session pricing.",
      steps: ["Loading tutor calendar", "Checking open session times", "Ready to book"],
    };
  }
  return {
    kicker: "Booking",
    title: "Opening free consultation…",
    body: "Preparing this tutor’s calendar for a 15-minute intro.",
    steps: ["Loading tutor calendar", "Checking open consult times", "Ready to book"],
  };
}

function isBookingPath(url: URL) {
  return /\/tutors\/[^/]+\/book\/?$/.test(url.pathname);
}

const PAGE_LABELS: Record<string, string> = {
  application: "Application",
  applications: "Applications",
  assignments: "Assignments",
  availability: "Availability",
  analytics: "Analytics",
  billing: "Billing",
  bookings: "Bookings",
  calendar: "Calendar",
  earnings: "Earnings",
  homework: "Homework",
  inbox: "Inbox",
  messages: "Messages",
  overview: "Overview",
  payments: "Payments",
  profile: "Profile",
  progress: "Progress",
  reviews: "Reviews",
  safety: "Safety",
  sessions: "Sessions",
  settings: "Settings",
  students: "Students",
  tutors: "Tutors",
  parent: "Parent desk",
  student: "Student desk",
  tutor: "Tutor desk",
  admin: "Admin",
  book: "Booking",
  become: "Become a tutor",
  about: "About",
  subjects: "Subjects",
  faq: "FAQ",
  login: "Log in",
  register: "Register",
};

function pageLabelFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return "Home";

  // Prefer the most specific known segment from the end (skip dynamic ids).
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (/^[0-9a-f-]{8,}$/i.test(part) || part.length > 40) continue;
    if (PAGE_LABELS[part]) return PAGE_LABELS[part];
    if (/^[a-z0-9-]+$/i.test(part)) {
      return part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }

  if (parts[0] === "dashboard") return "Dashboard";
  return "Page";
}

function generalCopy(url: URL): Omit<LoadingModal, "step"> {
  const label = pageLabelFromPath(url.pathname);
  return {
    kicker: label,
    title: `Opening ${label}…`,
    body: `Loading ${label.toLowerCase()}. Hang tight for a moment.`,
  };
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modal, setModal] = useState<LoadingModal | null>(null);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef<number | null>(null);
  const stepTimers = useRef<number[]>([]);
  const progressTimers = useRef<number[]>([]);
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
      progressTimers.current.forEach((timer) => window.clearTimeout(timer));
      stepTimers.current = [];
      progressTimers.current = [];

      const copy = isBookingPath(url) ? bookingCopy(url) : generalCopy(url);
      setModal({ ...copy, step: 0 });
      setProgress(18);
      document.body.style.overflow = "hidden";

      progressTimers.current = [
        window.setTimeout(() => setProgress(42), 180),
        window.setTimeout(() => setProgress(68), 500),
        window.setTimeout(() => setProgress(86), 1100),
      ];

      if (copy.steps?.length) {
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
    if (!modal) return;
    setProgress(100);
    stepTimers.current.forEach((timer) => window.clearTimeout(timer));
    progressTimers.current.forEach((timer) => window.clearTimeout(timer));
    stepTimers.current = [];
    progressTimers.current = [];
    hideTimer.current = window.setTimeout(() => {
      setModal(null);
      setProgress(0);
      document.body.style.overflow = "";
    }, 220);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // Complete when the destination route finishes rendering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="nav-loading-title"
      aria-busy="true"
    >
      <div className="w-full max-w-md border border-line bg-white p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-mist">
            <Spinner className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="kicker">{modal.kicker}</p>
            <h2 id="nav-loading-title" className="mt-1 font-serif text-3xl text-navy">
              {modal.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-mute">{modal.body}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-mute">
            <span>Progress</span>
            <span>{Math.min(100, Math.round(progress))}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {modal.steps?.length ? (
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
        ) : null}
      </div>
    </div>
  );
}
