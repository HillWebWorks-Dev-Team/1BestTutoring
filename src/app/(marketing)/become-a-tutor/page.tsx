import type { Metadata } from "next";
import Link from "next/link";
import { ApplyForm } from "@/components/forms/ApplyForm";
import { splitList } from "@/lib/brand";
import { live } from "@/lib/live";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Become a tutor" };
export const dynamic = "force-dynamic";

const STEPS = [
  {
    step: "01",
    title: "Apply",
    body: "Share your university, subjects, rate, and photo. Nothing goes public until we approve you.",
  },
  {
    step: "02",
    title: "Verification",
    body: "We review your materials and may ask for credentials or proof of enrollment.",
  },
  {
    step: "03",
    title: "Approval",
    body: "Pending, waitlisted, or approved. Only approved tutors join the directory and receive students.",
  },
];

export default async function BecomeTutorPage() {
  const session = await getSession();
  const db = await live();
  const user = session
    ? await db.user.findUnique({ where: { id: session.uid }, include: { tutorProfile: true } })
    : null;
  const profile = user?.tutorProfile;

  return (
    <div>
      <section className="relative overflow-hidden bg-deep text-ivory">
        <img
          src="/images/campus-dusk.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/90 to-deep/55" aria-hidden />
        <div className="shell relative py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="kicker">Become a tutor</p>
            <h1 className="display mt-4 text-5xl text-ivory md:text-6xl">
              Teach with a practice, not a gig app.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ivory/75">
              We review every application. Approved tutors set their own rate, keep their promised share, and only see
              students we officially assign.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#application" className="btn btn-primary">
                Start application
              </a>
              <Link href="/how-it-works" className="btn btn-ghost">
                How matching works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-ivory py-12">
        <div className="shell">
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <article key={item.step} className="border border-line bg-white px-5 py-6">
                <span className="grid h-10 w-10 place-items-center border border-gold font-serif text-gold">
                  {index + 1}
                </span>
                <h2 className="mt-4 font-serif text-2xl text-navy">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-mute">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="application" className="bg-white py-14">
        <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <p className="kicker">Application</p>
            <h2 className="display mt-3 text-4xl text-navy md:text-5xl">Tell us who you teach as.</h2>
            <p className="mt-4 text-base leading-7 text-mute">
              Use the dropdowns where you can. Choose Other when nothing fits, then type your answer. A clear profile
              photo is required.
            </p>
            <ul className="mt-8 space-y-3 text-sm leading-6 text-mute">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden />
                University names describe where you studied — not an endorsement.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden />
                You set your hourly rate within our platform limits.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden />
                Paid students arrive only after our team confirms the match.
              </li>
            </ul>
          </aside>

          <div className="border border-line bg-ivory/40 p-5 sm:p-8">
            <ApplyForm
              signedIn={user?.role === "TUTOR"}
              requirePhoto={!user?.imageUrl}
              defaults={
                profile
                  ? {
                      name: user?.name,
                      email: user?.email,
                      university: profile.university,
                      major: profile.major,
                      degree: profile.degree,
                      graduationYear: profile.graduationYear,
                      bio: profile.bio,
                      experience: profile.experience,
                      subjects: splitList(profile.subjects),
                      gradeLevels: splitList(profile.gradeLevels),
                      hourlyRate: profile.hourlyRateCents / 100,
                      linkedinUrl: profile.linkedinUrl || undefined,
                      education: profile.education,
                      achievements: profile.achievements,
                      certifications: profile.certifications,
                      testScores: profile.testScores,
                    }
                  : user
                    ? { name: user.name, email: user.email }
                    : undefined
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
