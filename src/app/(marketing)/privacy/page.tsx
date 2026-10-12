import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="kicker">Privacy</p>
      <h1 className="display mt-4 text-6xl text-navy">What we keep, and who can see it.</h1>
      <div className="mt-8 space-y-5 leading-7 text-mute">
        <p>Accounts store a name, email, password hash, time zone, and the academic details needed to tutor or to learn. Payment card numbers are handled by Stripe, not stored on this site.</p>
        <p>Tutor profiles that we approve are public: name, university, subjects, rate, biography, and reviews. Application documents, messages, homework, and session notes are private to the people in that relationship and to administrators.</p>
        <p>Students cannot open another student’s dashboard, messages, or files. Tutors see only the students assigned to them.</p>
        <p>This page describes how the platform is built. It is not a substitute for a lawyer-reviewed policy before you enroll real families.</p>
      </div>
    </div>
  );
}
