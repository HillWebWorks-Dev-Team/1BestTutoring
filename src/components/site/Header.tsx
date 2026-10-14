"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand";

const links = [
  { href: "/tutors", label: "Tutors" },
  { href: "/subjects", label: "Subjects" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/become-a-tutor", label: "Become a tutor" },
];

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-deep text-ivory">
      <div className="shell flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label="1% Better Tutoring home" onClick={() => setOpen(false)}>
          <Logo light />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ivory/75 xl:flex" aria-label="Primary">
          {links.map((link) => {
            const current = active(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`relative py-1 transition hover:text-ivory ${
                  current ? "font-medium text-ivory" : ""
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-gold transition ${
                    current ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
          <Link href={signedIn ? "/dashboard" : "/login"} className="px-3 py-2 text-sm text-ivory/80 transition hover:text-ivory">
            {signedIn ? "Dashboard" : "Log in"}
          </Link>
          <Link href="/tutors" className="btn btn-primary">
            Find a tutor
          </Link>
        </div>
        <button
          className="inline-flex h-10 items-center px-2 text-sm text-ivory xl:hidden"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-white/10 px-5 py-4 xl:hidden">
          <nav className="shell !px-0 space-y-1" aria-label="Mobile">
            {links.map((link) => {
              const current = active(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={`block border-l-2 px-3 py-2.5 text-base transition ${
                    current
                      ? "border-gold font-medium text-ivory"
                      : "border-transparent text-ivory/90 hover:text-ivory"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 pt-3">
              <Link href={signedIn ? "/dashboard" : "/login"} className="btn btn-ghost" onClick={() => setOpen(false)}>
                {signedIn ? "Dashboard" : "Log in"}
              </Link>
              <Link href="/tutors" className="btn btn-primary" onClick={() => setOpen(false)}>
                Find a tutor
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
