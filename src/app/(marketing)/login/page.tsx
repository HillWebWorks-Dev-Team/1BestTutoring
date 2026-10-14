import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Log in" };

const demos = [
  ["Admin", "admin@onepercentbetter.com"],
  ["Student", "jordan@onepercentbetter.com"],
  ["Tutor", "maya.chen@onepercentbetter.com"],
  ["Applicant", "liam.foster@onepercentbetter.com"],
  ["Parent", "danielle@onepercentbetter.com"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <div className="relative isolate flex min-h-[calc(100svh-73px)] items-center justify-center overflow-hidden bg-deep px-5 py-10 sm:py-14">
      <img src="/images/campus-dusk.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 -z-10 bg-deep/50" aria-hidden="true" />
      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-9">
        <p className="kicker">Welcome back</p>
        <h1 className="display mt-3 text-4xl text-navy">Log in to your account.</h1>
        <p className="mb-7 mt-3 text-sm leading-6 text-mute">Continue your learning journey with 1% Better.</p>
        <LoginForm next={params.next} />
        <p className="mt-6 border-t border-line pt-6 text-center text-sm text-mute">
          New here? <Link href="/register" className="font-semibold text-navy underline underline-offset-4">Create an account</Link>
        </p>
        <p className="mt-4 text-center text-xs text-mute">Need help signing in? <Link href="/contact" className="text-navy underline underline-offset-4">Contact us</Link></p>
        {process.env.NODE_ENV !== "production" ? (
          <details className="mt-6 rounded-lg border border-line bg-ivory p-4 text-xs text-mute">
            <summary className="cursor-pointer font-medium text-navy">Development demo accounts</summary>
            <p className="mt-3">Password: OnePercent!2026</p>
            <ul className="mt-2 space-y-1 break-words">{demos.map(([label, email]) => <li key={email}>{label}: {email}</li>)}</ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}
