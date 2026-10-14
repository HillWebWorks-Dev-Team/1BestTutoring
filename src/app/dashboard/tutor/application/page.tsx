import Link from "next/link";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { hourly } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const copy: Record<string, string> = {
  PENDING: "Pending review. We’ll read the application before anything goes public.",
  WAITLISTED: "Waitlisted. You can sign in anytime. Teaching tools stay closed.",
  MORE_INFO: "We need more information before a decision.",
  APPROVED: "Approved. Your profile can appear in the directory.",
  REJECTED: "Not approved. You can update the application and send it again.",
};

export default async function ApplicationStatus({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const docs = await db.document.findMany({
    where: { userId: user.id, kind: { in: ["RESUME", "CREDENTIAL", "ENROLLMENT_PROOF", "PROFILE_PHOTO"] } },
  });
  const profile = user.tutorProfile;
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-5xl text-navy">No application yet</h1>
        <p className="mt-4 text-mute">Start an application when you’re ready to teach with us.</p>
        <Link href="/become-a-tutor" className="btn btn-primary mt-8">
          Start application
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker">Application</p>
      <div className="mt-4 flex flex-wrap items-start gap-5">
        <Portrait name={user.name} src={user.imageUrl} className="h-24 w-24 shrink-0 rounded-xl text-2xl" />
        <div>
          <h1 className="font-serif text-5xl text-navy">{profile.status.replaceAll("_", " ")}</h1>
          <p className="mt-3 max-w-xl leading-7 text-mute">{copy[profile.status]}</p>
        </div>
      </div>

      <div className="my-5">
        <Notice
          success={query.submitted ? "Application submitted. We’ll review it shortly." : undefined}
        />
      </div>

      {profile.moreInfoRequest ? (
        <p className="rounded-none border border-gold/40 bg-cream px-4 py-3 text-sm leading-6 text-navy">
          {profile.moreInfoRequest}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-4 border border-line bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-mute">University</dt>
          <dd className="mt-1 font-medium text-navy">{profile.university}</dd>
        </div>
        <div>
          <dt className="text-mute">Degree / major</dt>
          <dd className="mt-1 font-medium text-navy">
            {profile.degree} in {profile.major} · {profile.graduationYear}
          </dd>
        </div>
        <div>
          <dt className="text-mute">Rate</dt>
          <dd className="mt-1 font-medium text-navy">{hourly(profile.hourlyRateCents)}</dd>
        </div>
        <div>
          <dt className="text-mute">Subjects</dt>
          <dd className="mt-1 font-medium text-navy">{profile.subjects}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-mute">Documents</dt>
          <dd className="mt-1 text-navy">
            {docs.map((doc) => doc.fileName).join(", ") || "None uploaded"}
          </dd>
        </div>
      </dl>

      {profile.status !== "APPROVED" ? (
        <Link href="/become-a-tutor" className="btn btn-primary mt-8">
          Update application
        </Link>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/tutors/${profile.slug}`} className="btn btn-primary">
            View public profile
          </Link>
          <Link href="/dashboard/tutor/earnings" className="btn btn-line">
            Set up payouts
          </Link>
        </div>
      )}
    </div>
  );
}
