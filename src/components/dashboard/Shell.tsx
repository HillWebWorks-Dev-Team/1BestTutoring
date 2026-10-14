"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { logout } from "@/server/auth";
import { stopImpersonation } from "@/server/impersonation";

export type DashLink = { href: string; label: string; locked?: boolean; badge?: number };

export function DashboardShell({
  name,
  role,
  links,
  unread,
  demo,
  viewingAs,
  children,
}: {
  name: string;
  role: string;
  links: DashLink[];
  unread: number;
  demo: boolean;
  viewingAs?: { adminName: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-ivory md:grid md:grid-cols-[250px_1fr]">
      <aside
        className={`${open ? "block" : "hidden"} border-r border-white/10 bg-navy text-ivory md:sticky md:top-0 md:block md:h-screen md:self-start`}
      >
        <div className="flex h-full min-h-0 flex-col px-4 py-5">
          <div className="shrink-0">
            <Link href="/" onClick={() => setOpen(false)}>
              <Logo light />
            </Link>
            <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-gold/70">{role}</p>
          </div>
          <nav className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
            {links.map((link) => {
              const activeHref = [...links]
                .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                .sort((a, b) => b.href.length - a.href.length)[0]?.href;
              const active = link.href === activeHref;
              return (
                <Link
                  key={link.href}
                  href={link.locked ? "#" : link.href}
                  aria-disabled={link.locked}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${active ? "bg-gold/15 text-gold" : "text-ivory/75 hover:bg-white/5"} ${link.locked ? "pointer-events-none opacity-40" : ""}`}
                >
                  <span>{link.label}</span>
                  {link.badge ? (
                    <span
                      className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                        active ? "bg-gold text-deep" : "bg-gold text-deep"
                      }`}
                      aria-label={`${link.badge} unread`}
                    >
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
            <Link href="/dashboard/notifications" className="block text-sm text-ivory/80" onClick={() => setOpen(false)}>
              Notifications{unread ? ` (${unread})` : ""}
            </Link>
            <p className="mt-4 text-sm text-ivory">{name}</p>
            {viewingAs ? (
              <form action={stopImpersonation} className="mt-3">
                <button className="text-sm text-gold" type="submit">
                  Exit view-as
                </button>
              </form>
            ) : null}
            <form action={logout} className="mt-3">
              <button className="text-sm text-ivory/60" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div>
        <div className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <button className="btn btn-line" type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "Menu"}
          </button>
          <Link href="/dashboard/notifications" className="text-sm">
            Alerts{unread ? ` (${unread})` : ""}
          </Link>
        </div>
        {viewingAs ? (
          <div className="flex flex-wrap items-center justify-center gap-3 border-b border-gold/40 bg-gold/15 px-5 py-2.5 text-center text-xs text-navy">
            <span>
              Viewing as <strong>{name}</strong> ({role}) · read-only · signed in as {viewingAs.adminName}
            </span>
            <form action={stopImpersonation}>
              <button className="font-semibold underline" type="submit">
                Back to admin
              </button>
            </form>
          </div>
        ) : null}
        {demo ? (
          <div className="border-b border-cream bg-cream/70 px-5 py-2 text-center text-xs text-navy">
            Demo payments are on. Splits are calculated for real, and no card is charged until Stripe keys are added.
          </div>
        ) : null}
        <div className="min-h-[70vh] px-4 py-6 text-navy md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}
