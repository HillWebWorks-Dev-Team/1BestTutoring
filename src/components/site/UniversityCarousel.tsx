"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { University } from "@/lib/universities";

function SchoolCard({ school }: { school: University }) {
  return (
    <Link
      href={`/tutors?university=${encodeURIComponent(school.name)}`}
      className="group flex h-full min-w-[168px] snap-center flex-col items-center justify-center border border-line bg-white px-4 py-5 transition hover:border-navy/25 sm:min-w-[180px]"
      aria-label={`View tutors from ${school.name}`}
    >
      <span className="grid h-16 w-16 place-items-center">
        <img
          src={school.logo}
          alt=""
          className="h-14 w-14 object-contain"
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="mt-3 min-w-0 text-center">
        <span className="block font-serif text-xl leading-tight text-navy">{school.short}</span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-mute">{school.group}</span>
      </span>
    </Link>
  );
}

export function UniversityCarousel({ schools }: { schools: University[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const node = midRef.current;
    const root = scroller.current;
    if (!node || !root) return;
    const left = node.offsetLeft - (root.clientWidth - node.offsetWidth) / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [schools]);

  function scrollBy(direction: -1 | 1) {
    const root = scroller.current;
    if (!root) return;
    root.scrollBy({ left: direction * Math.round(root.clientWidth * 0.7), behavior: "smooth" });
  }

  const midIndex = Math.floor(schools.length / 2);

  return (
    <div className="relative mt-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-ivory to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ivory to-transparent sm:w-16" />

      <button
        type="button"
        className="absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-line bg-white text-navy shadow-sm transition hover:border-navy/30 sm:grid"
        onClick={() => scrollBy(-1)}
        aria-label="Previous universities"
      >
        ←
      </button>
      <button
        type="button"
        className="absolute right-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-line bg-white text-navy shadow-sm transition hover:border-navy/30 sm:grid"
        onClick={() => scrollBy(1)}
        aria-label="Next universities"
      >
        →
      </button>

      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto scroll-smooth px-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory sm:px-12 [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Universities with verified tutors"
      >
        {schools.map((school, index) => (
          <li
            key={school.name}
            ref={index === midIndex ? midRef : undefined}
            className="list-none"
            role="listitem"
          >
            <SchoolCard school={school} />
          </li>
        ))}
      </div>
    </div>
  );
}
