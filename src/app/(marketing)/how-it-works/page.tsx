import type { Metadata } from "next";
import Link from "next/link";
import { HOW_IT_WORKS } from "@/lib/content";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="kicker">The path</p>
      <h1 className="display mt-4 max-w-3xl text-6xl text-navy">From a profile to a standing appointment.</h1>
      <div className="mt-12 grid gap-6">
        {HOW_IT_WORKS.map((item) => (
          <article key={item.step} className="grid gap-4 border-t border-line py-6 md:grid-cols-[120px_1fr]">
            <p className="font-serif text-4xl text-gold">{item.step}</p>
            <div>
              <h2 className="font-serif text-3xl">{item.title}</h2>
              <p className="mt-2 max-w-2xl text-mute leading-7">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="card p-6">
          <p className="kicker">For students and parents</p>
          <p className="mt-3 leading-7 text-mute">
            Create an account, compare tutors by school, subject, grade level, and rate, then book a free 15-minute consultation on our calendar. If you want to continue, request the tutor. Paid booking, messages, and homework unlock after the assignment.
          </p>
        </article>
        <article className="card p-6">
          <p className="kicker">For tutors</p>
          <p className="mt-3 leading-7 text-mute">
            Apply with your university, subjects, and credentials. You can sign in and watch the status, but the public directory stays closed until we approve you. Then you set your rate, your hours, and complete Stripe Connect before paid sessions.
          </p>
        </article>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/tutors" className="btn btn-primary">Find a tutor</Link>
        <Link href="/become-a-tutor" className="btn btn-line">Become a tutor</Link>
      </div>
    </div>
  );
}
