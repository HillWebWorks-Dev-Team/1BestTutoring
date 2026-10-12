"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tutors", label: "Tutors" },
  { href: "/subjects", label: "Subjects" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/faq", label: "FAQ" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-deep text-ivory">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5">
        <Link href="/" aria-label="1% Better Tutoring home" onClick={() => setOpen(false)}>
          <Logo light />
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-ivory/80 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ivory">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href={signedIn ? "/dashboard" : "/login"} className="btn btn-ghost">
            {signedIn ? "Dashboard" : "Log in"}
          </Link>
          <Link href="/tutors" className="btn btn-primary">
            Find a tutor
          </Link>
        </div>
        <button
          className="btn btn-ghost lg:hidden"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="space-y-1 border-t border-white/10 px-5 py-4 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-lg px-2 py-2.5 text-base text-ivory/90" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3">
            <Link href={signedIn ? "/dashboard" : "/login"} className="btn btn-ghost" onClick={() => setOpen(false)}>
              {signedIn ? "Dashboard" : "Log in"}
            </Link>
            <Link href="/tutors" className="btn btn-primary" onClick={() => setOpen(false)}>
              Find a tutor
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
