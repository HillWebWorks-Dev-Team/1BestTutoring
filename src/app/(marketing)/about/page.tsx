import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="kicker">Our mission</p>
      <h1 className="display mt-4 max-w-4xl text-6xl text-navy">A tutoring company with the manners of a good school.</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 text-lg leading-8 text-mute">
          <p>
            1% Better Tutoring exists for students who want steady academic progress with people who have actually done the work: tutors from the Ivy League and other top-30 universities, reviewed by us before they ever appear in the directory.
          </p>
          <p>
            The name is the method. We are not interested in theatrical transformations. We are interested in the next clean hour — a concept that sticks, a paper that gets sharper, a score that moves because the practice did.
          </p>
          <p>
            Students can browse and book a free consultation on their own. Ongoing tutoring starts only when our team assigns the relationship. That is deliberate. It keeps families, tutors, and the company responsible for the same plan.
          </p>
        </div>
        <aside className="card bg-navy p-7 text-ivory">
          <p className="kicker">What we will not pretend</p>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-ivory/80">
            <li>University names describe where a tutor studied. They are not endorsements.</li>
            <li>Tutors cannot add themselves to a student’s roster.</li>
            <li>There is no required subscription. Hours are purchased as they are booked.</li>
            <li>The platform commission is configured by us, never by a tutor editing their own cut.</li>
          </ul>
        </aside>
      </div>
      <div className="mt-16">
        <p className="kicker">Roadmap</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Phase 1", "The desk you can use now: public site, applications, consultations, matching, messaging, homework, Zoom-ready booking, and Stripe Connect splits."],
            ["Phase 2", "Deeper parent tools, referrals, reviews, reminders, Google Calendar sync, and fuller financial reporting. The models for these are already in the platform."],
            ["Phase 3", "Smarter tutor recommendations, AI practice tools, and group sessions — after the human match is trustworthy."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-line p-5">
              <h2 className="font-serif text-3xl">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-mute">{body}</p>
            </article>
          ))}
        </div>
      </div>
      <Link href="/how-it-works" className="btn btn-primary mt-10">
        See how a match works
      </Link>
    </div>
  );
}
