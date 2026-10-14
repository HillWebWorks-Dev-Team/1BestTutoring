import { Suspense } from "react";
import { HomeHero } from "@/components/site/HomeHero";
import { ReviewsSection } from "@/components/site/HomeReviews";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Calculator,
  Calendar,
  Code2,
  Compass,
  FlaskConical,
  GraduationCap,
  Library,
  LineChart,
  PenLine,
  Shield,
  UserRound,
} from "lucide-react";
import { TutorCard } from "@/components/tutors/TutorCard";
import { UniversityShowcase } from "@/components/site/UniversityShowcase";
import { HOW_IT_WORKS } from "@/lib/content";
import { toTutorCard } from "@/lib/cards";
import { getHomePayload } from "@/lib/home";

export const dynamic = "force-dynamic";

const SUBJECTS = [
  { title: "Mathematics", href: "/tutors?subject=Mathematics", icon: Calculator },
  { title: "Science", href: "/subjects", icon: FlaskConical },
  { title: "English", href: "/tutors?subject=English", icon: BookOpen },
  { title: "Computer Science", href: "/tutors?subject=Computer%20Science", icon: Code2 },
  { title: "SAT / ACT Prep", href: "/tutors?subject=SAT%20%2F%20ACT%20Prep", icon: GraduationCap },
  { title: "College Essays", href: "/tutors?subject=College%20Essays", icon: PenLine },
  { title: "Economics", href: "/tutors?subject=Economics", icon: LineChart },
  { title: "Study Skills", href: "/how-it-works", icon: Compass },
];

const BENEFITS = [
  {
    title: "Personalised learning",
    body: "Sessions follow the assignment in front of the student, not a generic course.",
    icon: UserRound,
  },
  {
    title: "Verified expert tutors",
    body: "Only approved tutors appear in the directory, after materials are reviewed.",
    icon: BadgeCheck,
  },
  {
    title: "Flexible scheduling",
    body: "Book a free 15-minute consultation on the tutor’s own calendar.",
    icon: Calendar,
  },
  {
    title: "Safe and secure sessions",
    body: "Paid tutoring starts only after our team confirms the student–tutor match.",
    icon: Shield,
  },
  {
    title: "Meaningful progress",
    body: "Homework, session notes, and feedback stay with the assignment.",
    icon: LineChart,
  },
  {
    title: "Wide range of subjects",
    body: "From core academics to exams and essays, with tutors who teach that material.",
    icon: Library,
  },
];

function SectionSkeleton({ className = "h-48" }: { className?: string }) {
  return <div className={`animate-pulse bg-line/50 ${className}`} aria-hidden />;
}

async function HomeUniversities() {
  const { schools } = await getHomePayload();
  return <UniversityShowcase schools={schools} />;
}

async function FeaturedTutors() {
  const { tutors } = await getHomePayload();
  const featured = (tutors.filter((tutor) => tutor.featured).length ? tutors.filter((tutor) => tutor.featured) : tutors).slice(0, 4);
  if (!featured.length) {
    return <p className="mt-8 text-mute">Approved tutors will appear here after verification.</p>;
  }
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {featured.map((tutor) => (
        <TutorCard key={tutor.id} tutor={toTutorCard(tutor)} variant="preview" />
      ))}
    </div>
  );
}

async function HomeReviews() {
  const { reviews } = await getHomePayload();
  return <ReviewsSection reviews={reviews} />;
}

export default function HomePage() {
  return (
    <div>
      <HomeHero />

      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <HomeUniversities />
      </Suspense>

      <section className="border-y border-line bg-white py-16">
        <div className="shell text-center">
          <p className="kicker">Explore subjects</p>
          <h2 className="display mx-auto mt-3 max-w-3xl text-4xl text-navy md:text-5xl">
            Learn from experienced tutors in the subjects you need.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-mute">
            Browse by subject, then open a tutor who already teaches that material.
          </p>
          <div className="mx-auto mt-10 flex max-w-full gap-4 overflow-x-auto pb-3 lg:justify-between lg:gap-2">
            {SUBJECTS.map((subject) => (
              <Link key={subject.title} href={subject.href} className="group flex min-w-[120px] shrink-0 flex-col items-center gap-3 whitespace-nowrap px-1 text-xs text-navy lg:min-w-0 lg:flex-1">
                <span className="grid h-14 w-14 place-items-center text-gold transition group-hover:text-gold-light">
                  <subject.icon className="h-10 w-10" strokeWidth={1.5} />
                </span>
                {subject.title}
              </Link>
            ))}
          </div>
          <Link href="/subjects" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-navy">
            <span className="underline underline-offset-4">View all subjects</span> <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="bg-ivory py-16">
        <div className="shell grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="kicker">Why choose us</p>
            <h2 className="display mt-3 max-w-md text-4xl text-navy md:text-5xl">Tutoring for the work in front of you.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-mute">
              A free consultation, an admin-confirmed match, then paid hours only when you schedule them.
            </p>
            <Link href="/about" className="btn btn-line mt-8">
              Learn more
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((item) => (
              <article key={item.title} className="border border-line bg-white px-5 py-5">
                <item.icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-2xl text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-mute">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Featured tutors</p>
              <h2 className="display mt-3 text-4xl text-navy md:text-5xl">People you can actually book.</h2>
            </div>
            <Link href="/tutors" className="btn btn-primary">
              View all tutors
            </Link>
          </div>
          <Suspense fallback={<SectionSkeleton className="mt-10 h-80" />}>
            <FeaturedTutors />
          </Suspense>
        </div>
      </section>

      <section className="bg-deep py-16 text-ivory">
        <div className="shell">
          <p className="kicker">How it works</p>
          <h2 className="display mt-3 max-w-xl text-4xl text-ivory md:text-5xl">Simple steps. Real results.</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {HOW_IT_WORKS.map((item, index) => (
              <li key={item.step} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold font-serif text-gold">
                    {index + 1}
                  </span>
                  {index < HOW_IT_WORKS.length - 1 ? <span className="hidden h-px flex-1 bg-gold/40 md:block" aria-hidden /> : null}
                </div>
                <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory/70">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Suspense fallback={<SectionSkeleton className="h-80" />}>
        <HomeReviews />
      </Suspense>

      <section className="bg-deep">
        <div className="relative w-full overflow-hidden">
          <img
            src="/images/campus-dusk.jpg"
            alt="A university courtyard in evening light"
            className="h-[380px] w-full object-cover sm:h-[360px]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep/85 via-deep/50 to-deep/20" />
          <div className="shell absolute inset-0 flex flex-col justify-center">
            <h2 className="display text-4xl text-ivory sm:text-5xl">Ready to get started?</h2>
            <p className="mt-4 max-w-md text-lg leading-7 text-ivory/80">
              Your next academic breakthrough starts with one small step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tutors" className="btn btn-primary">
                Find a tutor
              </Link>
              <Link href="/tutors" className="btn btn-ghost">
                Book a free consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
