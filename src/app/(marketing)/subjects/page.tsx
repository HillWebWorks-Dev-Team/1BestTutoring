import type { Metadata } from "next";
import Link from "next/link";
import { SUBJECT_COPY } from "@/lib/content";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="shell py-16 md:py-20">
          <p className="kicker">Tutoring services</p>
          <h1 className="display mt-4 max-w-3xl text-5xl text-ivory md:text-6xl">Subjects with a point of view.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ivory/75">
            Every subject below is taught by approved tutors. Open a subject to see who teaches it, what they charge, and
            when they can meet.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-14">
        <div className="shell grid gap-4 md:grid-cols-2">
          {Object.entries(SUBJECT_COPY).map(([subject, copy]) => (
            <Link
              key={subject}
              href={`/tutors?subject=${encodeURIComponent(subject)}`}
              className="block border border-line bg-white p-6 transition hover:border-navy/30"
            >
              <h2 className="font-serif text-3xl text-navy">{subject}</h2>
              <p className="mt-3 text-sm leading-6 text-mute">{copy}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-navy underline underline-offset-4">
                See tutors
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
