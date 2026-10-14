"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/server/auth";
import { Spinner } from "@/components/ui/PageLoader";

function SignOutModalBody({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (pending) {
    return (
      <div className="flex items-start gap-4" aria-busy="true">
        <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-mist">
          <Spinner className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="kicker">Account</p>
          <h2 id="sign-out-title" className="mt-1 font-serif text-3xl text-navy">
            Signing you out
          </h2>
          <p id="sign-out-body" className="mt-2 text-sm leading-6 text-mute">
            Hang tight - ending your session. Don’t close this tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="kicker">Account</p>
      <h2 id="sign-out-title" className="mt-1 font-serif text-3xl text-navy">
        Sign out?
      </h2>
      <p id="sign-out-body" className="mt-2 text-sm leading-6 text-mute">
        Are you sure you want to sign out? You’ll need to log in again to open your dashboard.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-line whitespace-nowrap" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary whitespace-nowrap">
          Yes, sign out
        </button>
      </div>
    </>
  );
}

export function SignOutButton({ className = "text-sm text-ivory/60" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        Sign out
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/55 px-5 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
          aria-describedby="sign-out-body"
        >
          <div className="w-full max-w-md border border-line bg-white p-6 shadow-[0_24px_60px_-28px_rgb(11_29_51_/_0.65)]">
            <form action={logout}>
              <SignOutModalBody onCancel={() => setOpen(false)} />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
