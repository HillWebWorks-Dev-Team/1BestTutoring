import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="kicker">Students and families</p>
      <h1 className="display mt-4 text-6xl text-navy">Safety is part of the product.</h1>
      <div className="mt-8 space-y-5 leading-7 text-mute">
        <p>Messaging is limited to tutors and students who have been officially assigned. A tutor cannot open a private thread with a student they have not been matched with.</p>
        <p>Students in middle school, and anyone who adds a guardian email, are marked as minors. A parent can link the student only when that guardian email matches the parent account. Admins can also connect the accounts.</p>
        <p>Every message thread and the contact page include a way to report a concern. Reports go to the admin safety desk, not to the other person in the conversation.</p>
        <p>Documents such as resumes and enrollment proof are visible to the applicant and to admins. Session notes are visible to the student, their linked parent, and the assigned tutor.</p>
        <Link href="/contact" className="btn btn-primary">Report a concern</Link>
      </div>
    </div>
  );
}
