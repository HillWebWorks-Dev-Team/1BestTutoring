import type { Metadata } from "next";
import Link from "next/link";
import { HOW_IT_WORKS } from "@/lib/content";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="shell py-16 md:py-20">
          <p className="kicker">The path</p>
          <h1 className="display mt-4 max-w-3xl text-5xl text-ivory md:text-6xl">
            From a profile to a standing appointment.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ivory/75">
            Browse tutors, book a free consultation, then continue only after we confirm the match.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-16">
        <div className="shell">
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HOW_IT_WORKS.map((item, index) => (
              <li key={item.step} className="border border-line bg-white px-5 py-6">
                <span className="grid h-10 w-10 place-items-center border border-gold font-serif text-gold">
                  {index + 1}
                </span>
                <h2 className="mt-4 font-serif text-2xl text-navy">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-mute">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line bg-white py-16">
        <div className="shell grid gap-4 md:grid-cols-2">
          <article className="border border-line bg-ivory/40 p-6">
            <p className="kicker">For students and parents</p>
            <h2 className="mt-3 font-serif text-3xl text-navy">Compare, consult, then get matched.</h2>
            <p className="mt-3 text-sm leading-7 text-mute">
              Create an account, compare tutors by school, subject, grade level, and rate, then book a free 15-minute
              consultation. If you want to continue, request the tutor. Paid booking, messages, and homework unlock after
              the assignment.
            </p>
          </article>
          <article className="border border-line bg-ivory/40 p-6">
            <p className="kicker">For tutors</p>
            <h2 className="mt-3 font-serif text-3xl text-navy">Apply, get reviewed, then teach.</h2>
            <p className="mt-3 text-sm leading-7 text-mute">
              Apply with your university, subjects, and credentials. You can sign in and watch the status, but the public
              directory stays closed until we approve you. Then you set your rate, your hours, and complete Stripe Connect
              before paid sessions.
            </p>
          </article>
        </div>
        <div className="shell mt-10 flex flex-wrap gap-3">
          <Link href="/tutors" className="btn btn-primary">
            Find a tutor
          </Link>
          <Link href="/become-a-tutor" className="btn btn-line">
            Become a tutor
          </Link>
        </div>
      </section>
    </div>
  );
}
