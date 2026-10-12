import Link from "next/link";
import { BookOpen, Calculator, Code2, Compass, FlaskConical, GraduationCap, LineChart, PenLine } from "lucide-react";
import { TutorCard } from "@/components/tutors/TutorCard";
import { HOW_IT_WORKS, SUBJECT_COPY } from "@/lib/content";
import { toTutorCard } from "@/lib/cards";
import { live } from "@/lib/live";
import { UNIVERSITY_DISCLAIMER, universityFor } from "@/lib/universities";

export const dynamic = "force-dynamic";

const SUBJECT_CARDS = [
  { title: "Mathematics", href: "/tutors?subject=Mathematics", icon: Calculator, copy: SUBJECT_COPY.Mathematics },
  { title: "Science", href: "/subjects", icon: FlaskConical, copy: "Physics, chemistry, and biology taught as systems a student can explain." },
  { title: "English", href: "/tutors?subject=English", icon: BookOpen, copy: SUBJECT_COPY.English },
  { title: "Computer Science", href: "/tutors?subject=Computer%20Science", icon: Code2, copy: SUBJECT_COPY["Computer Science"] },
  { title: "SAT / ACT Prep", href: "/tutors?subject=SAT%20%2F%20ACT%20Prep", icon: GraduationCap, copy: SUBJECT_COPY["SAT / ACT Prep"] },
  { title: "College Essays", href: "/tutors?subject=College%20Essays", icon: PenLine, copy: SUBJECT_COPY["College Essays"] },
  { title: "Economics", href: "/tutors?subject=Economics", icon: LineChart, copy: SUBJECT_COPY.Economics },
  { title: "Study Skills", href: "/how-it-works", icon: Compass, copy: "A standing hour, a short practice plan, and feedback that lives with the assignment." },
];

async function homeData() {
  try {
    const db = await live();
    const tutors = await db.tutorProfile.findMany({
      where: { status: "APPROVED", active: true, verified: true },
      include: { user: true, reviews: { where: { published: true } } },
      orderBy: [{ featured: "desc" }, { hourlyRateCents: "asc" }],
    });
    const reviews = await db.review.findMany({
      where: { published: true },
      include: { author: true, tutor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    const schools = [...new Set(tutors.map((tutor) => tutor.university))];
    return { tutors, schools, reviews };
  } catch {
    return { tutors: [], schools: [] as string[], reviews: [] };
  }
}

export default async function HomePage() {
  const { tutors, schools, reviews } = await homeData();
  const featured = (tutors.filter((tutor) => tutor.featured).length ? tutors.filter((tutor) => tutor.featured) : tutors).slice(0, 4);
  const orderedSchools = schools
    .map((name) => universityFor(name))
    .sort((a, b) => Number(a.group !== "Ivy League") - Number(b.group !== "Ivy League") || a.short.localeCompare(b.short));

  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div className="rise">
            <p className="kicker">World-class tutors. Real progress.</p>
            <h1 className="display mt-5 max-w-xl text-[clamp(3.1rem,6vw,5.3rem)] text-ivory">Get 1% Better Every Day.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-ivory/75">
              Connect with verified tutors from the Ivy League and other leading universities. Meet for a free consultation, then continue only after we confirm the match.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tutors" className="btn btn-primary">
                Find a tutor
              </Link>
              <Link href="/tutors" className="btn btn-ghost">
                Book a free consultation
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ivory/70">
              {["Verified tutors", "Top universities", "Personalized learning"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rise relative" style={{ animationDelay: "80ms" }}>
            <img
              src="/images/hero-study.jpg"
              alt="A student studying at a sunlit desk with a laptop and notebook"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <p className="script pointer-events-none absolute right-5 top-4 text-4xl text-gold drop-shadow-[0_2px_8px_rgba(11,29,51,0.45)]">
              1% better every day
            </p>
            <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border border-white/10 bg-deep/90 p-4 shadow-card backdrop-blur-sm">
              <p className="font-serif text-2xl leading-tight text-ivory">Small steps. Lasting progress.</p>
              <p className="mt-2 text-sm leading-5 text-ivory/70">A free 15-minute consultation, then a match our team confirms.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper py-10">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center font-serif text-2xl text-navy md:text-3xl">Learn from students and graduates of leading universities.</p>
          {orderedSchools.length ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {orderedSchools.map((school) => (
                <span key={school.name} className="font-serif text-xl tracking-tight text-navy/55 md:text-2xl">
                  {school.short}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-mute">University names appear here once a verified tutor from that school is approved.</p>
          )}
          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-mute">{UNIVERSITY_DISCLAIMER}</p>
        </div>
      </section>

      <section className="bg-ivory py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="kicker">Subjects</p>
            <h2 className="display mt-3 text-5xl text-navy">Tutoring for the work in front of you.</h2>
            <p className="mt-4 max-w-sm leading-7 text-mute">
              Browse by subject, then open a tutor who already teaches that material at your grade level.
            </p>
            <Link href="/subjects" className="btn btn-line mt-6">
              View all subjects
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECT_CARDS.map((subject) => (
              <Link key={subject.title} href={subject.href} className="card group block p-4 transition hover:-translate-y-0.5 hover:border-gold/50">
                <subject.icon className="h-5 w-5 text-gold" strokeWidth={1.6} />
                <h3 className="mt-3 font-serif text-2xl">{subject.title}</h3>
                <p className="mt-1 text-sm leading-6 text-mute">{subject.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Featured tutors</p>
              <h2 className="display mt-3 text-5xl text-navy">People you can actually book.</h2>
            </div>
            <Link href="/tutors" className="btn btn-primary">
              Explore all tutors
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((tutor) => (
              <TutorCard key={tutor.id} tutor={toTutorCard(tutor)} />
            ))}
          </div>
          {!featured.length ? <p className="mt-6 text-mute">Approved tutors will appear here after verification.</p> : null}
        </div>
      </section>

      <section className="bg-deep py-16 text-ivory">
        <div className="mx-auto max-w-6xl px-5">
          <p className="kicker">How it works</p>
          <h2 className="display mt-3 max-w-xl text-5xl text-ivory">Simple steps. Real results.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {HOW_IT_WORKS.map((item, index) => (
              <article key={item.step} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/70 font-serif text-gold">{item.step}</span>
                  {index < HOW_IT_WORKS.length - 1 ? <span className="hidden h-px flex-1 bg-gold/40 md:block" /> : null}
                </div>
                <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory/70">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-ivory py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="kicker">Reviews</p>
          <h2 className="display mt-3 text-5xl text-navy">From completed sessions.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mute">Published only after a finished tutoring session. We do not display placeholder quotes as customer reviews.</p>
          {reviews.length ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <article key={review.id} className="card p-6">
                  <p className="text-gold">{"★".repeat(review.rating)}</p>
                  <p className="mt-4 font-serif text-xl leading-8 text-navy">“{review.comment}”</p>
                  <p className="mt-5 text-sm font-medium">{review.author.name}</p>
                  <p className="text-xs text-mute">Student · session with {review.tutor.user.name}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-mute">Reviews will appear here after students finish sessions.</p>
          )}
        </div>
      </section>

      <section className="bg-ivory px-5 pb-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl">
          <img src="/images/campus-dusk.jpg" alt="A university courtyard in warm evening light" className="h-[440px] w-full object-cover" />
          <div className="absolute inset-0 bg-deep/75" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 py-10 text-ivory sm:px-12">
            <h2 className="display max-w-lg text-5xl sm:text-6xl">Ready to get started?</h2>
            <p className="mt-4 max-w-md text-lg leading-7 text-ivory/80">Your next academic breakthrough starts with one small step.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tutors" className="btn btn-primary">
                Find a tutor
              </Link>
              <Link href="/register" className="btn btn-ghost">
                Book a free consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
