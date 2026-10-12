import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="kicker">Legal</p>
      <h1 className="display mt-4 text-6xl text-navy">Terms of use</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-mute">
        <p>
          1% Better Tutoring provides a directory of tutors we have reviewed, a calendar for free introductory consultations, and paid sessions after an administrator assigns a student and tutor. Creating an account means you will use the platform for that purpose and will not share another person’s private academic information.
        </p>
        <p>
          Tutors set their own hourly rates. The platform commission is set by administrators and applies to future bookings only. Consultations are free. Paid sessions are charged through Stripe when live payments are enabled, or recorded in demo mode when they are not. Refunds for late cancellations are reviewed by the team.
        </p>
        <p>
          University names describe where a tutor studied. They are not endorsements, sponsorships, or official affiliations. Only schools with a verified tutor on the platform are shown.
        </p>
        <p>
          Messaging, homework, and paid booking stay limited to officially assigned pairs. We may suspend an account that misuses the directory, the calendar, or another person’s information.
        </p>
      </div>
    </div>
  );
}
