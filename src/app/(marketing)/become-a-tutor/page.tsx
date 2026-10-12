import type { Metadata } from "next";
import { ApplyForm } from "@/components/forms/ApplyForm";
import { splitList } from "@/lib/brand";
import { live } from "@/lib/live";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Become a tutor" };
export const dynamic = "force-dynamic";

export default async function BecomeTutorPage() {
  const session = await getSession();
  const db = await live();
  const user = session
    ? await db.user.findUnique({ where: { id: session.uid }, include: { tutorProfile: true } })
    : null;
  const profile = user?.tutorProfile;
  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <p className="kicker">Become a tutor</p>
          <h1 className="display mt-4 text-5xl text-ivory md:text-6xl">Teach with a practice, not a gig app.</h1>
          <p className="mt-4 leading-7 text-ivory/75">
            We review every application. Approved tutors set their own rate, keep their promised share, and only see students we officially assign.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ["01", "Apply", "Share your university, subjects, and rate. Nothing goes public yet."],
          ["02", "Verification", "We review materials and may ask for more information."],
          ["03", "Approval", "Pending, waitlisted, or approved. Only approved tutors join the directory."],
        ].map(([step, title, body]) => (
          <article key={step} className="card p-4">
            <p className="font-serif text-gold">{step}</p>
            <h2 className="mt-2 font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-mute">{body}</p>
          </article>
        ))}
      </div>
        <ApplyForm
          signedIn={user?.role === "TUTOR"}
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
                }
              : user
                ? { name: user.name, email: user.email }
                : undefined
          }
        />
      </div>
    </div>
  );
}
