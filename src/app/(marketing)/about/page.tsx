import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="shell py-16 md:py-20">
          <p className="kicker">Our mission</p>
          <h1 className="display mt-4 max-w-4xl text-5xl text-ivory md:text-6xl">
            A tutoring company with the manners of a good school.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ivory/75">
            Steady academic progress with tutors who have actually done the work - reviewed by us before they appear in
            the directory.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-16">
        <div className="shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 text-base leading-8 text-mute md:text-lg">
            <p>
              1% Better Tutoring exists for students who want steady academic progress with people who have actually done
              the work: tutors from the Ivy League and other top-30 universities, reviewed by us before they ever appear
              in the directory.
            </p>
            <p>
              The name is the method. We are not interested in theatrical transformations. We are interested in the next
              clean hour - a concept that sticks, a paper that gets sharper, a score that moves because the practice did.
            </p>
            <p>
              Students can browse and book a free consultation on their own. Ongoing tutoring starts only when our team
              assigns the relationship. That is deliberate. It keeps families, tutors, and the company responsible for
              the same plan.
            </p>
          </div>
          <aside className="border border-line bg-navy p-7 text-ivory">
            <p className="kicker">What we will not pretend</p>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-ivory/80">
              <li>University names describe where a tutor studied. They are not endorsements.</li>
              <li>Tutors cannot add themselves to a student’s roster.</li>
              <li>There is no required subscription. Hours are purchased as they are booked.</li>
              <li>The platform commission is configured by us, never by a tutor editing their own cut.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-t border-line bg-white py-16">
        <div className="shell">
          <p className="kicker">Roadmap</p>
          <h2 className="display mt-3 text-4xl text-navy md:text-5xl">Built in phases, on purpose.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [
                "Phase 1",
                "The desk you can use now: public site, applications, consultations, matching, messaging, homework, Zoom-ready booking, and Stripe Connect splits.",
              ],
              [
                "Phase 2",
                "Deeper parent tools, referrals, reviews, reminders, Google Calendar sync, and fuller financial reporting.",
              ],
              [
                "Phase 3",
                "Smarter tutor recommendations, AI practice tools, and group sessions - after the human match is trustworthy.",
              ],
            ].map(([title, body]) => (
              <article key={title} className="border border-line bg-ivory/40 p-5">
                <h3 className="font-serif text-3xl text-navy">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-mute">{body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/how-it-works" className="btn btn-primary">
              See how a match works
            </Link>
            <Link href="/tutors" className="btn btn-line">
              Find a tutor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
