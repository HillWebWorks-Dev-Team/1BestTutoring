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
    <div className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
      <div>
        <p className="kicker">Welcome back</p>
        <h1 className="display mt-4 text-6xl text-navy">Your desk is where you left it.</h1>
        <p className="mt-4 max-w-md text-mute">Students, parents, tutors, and the admin team all sign in here. What you see depends on your role.</p>
        <div className="mt-8 rounded-3xl border border-line bg-paper p-5">
          <p className="text-sm font-medium">Demo access · password OnePercent!2026</p>
          <ul className="mt-3 space-y-1 text-sm text-mute">
            {demos.map(([label, email]) => (
              <li key={email}>
                {label}: {email}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card p-6">
        <LoginForm next={params.next} />
        <p className="mt-4 text-sm text-mute">
          New student? <Link href="/register" className="underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
