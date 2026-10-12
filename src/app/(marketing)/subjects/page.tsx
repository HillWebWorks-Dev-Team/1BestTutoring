import type { Metadata } from "next";
import Link from "next/link";
import { SUBJECT_COPY } from "@/lib/content";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="kicker">Tutoring services</p>
      <h1 className="display mt-4 max-w-3xl text-6xl text-navy">Subjects with a point of view.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-mute">
        Every subject below is taught by approved tutors. Open a subject to see who teaches it, what they charge, and when they can meet.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {Object.entries(SUBJECT_COPY).map(([subject, copy]) => (
          <Link key={subject} href={`/tutors?subject=${encodeURIComponent(subject)}`} className="card block p-6 transition hover:-translate-y-1">
            <h2 className="font-serif text-3xl">{subject}</h2>
            <p className="mt-3 text-sm leading-6 text-mute">{copy}</p>
            <span className="mt-4 inline-block text-sm text-gold">See tutors</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
