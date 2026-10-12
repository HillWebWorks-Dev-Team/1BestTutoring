import Link from "next/link";
import { requireUser } from "@/lib/session";
import { live } from "@/lib/live";

export const dynamic = "force-dynamic";

const copy: Record<string, string> = {
  PENDING: "Pending review. We’ll read the application before anything goes public.",
  WAITLISTED: "Waitlisted. You can sign in anytime. Teaching tools stay closed.",
  MORE_INFO: "We need more information before a decision.",
  APPROVED: "Approved. Your profile can appear in the directory.",
  REJECTED: "Not approved. You can update the application and send it again.",
};

export default async function ApplicationStatus({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const db = await live();
  const docs = await db.document.findMany({ where: { userId: user.id, kind: { in: ["RESUME", "CREDENTIAL", "ENROLLMENT_PROOF"] } } });
  const profile = user.tutorProfile;
  if (!profile) return <p>No application yet. <Link href="/become-a-tutor">Start one</Link></p>;
  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker">Application</p>
      <h1 className="mt-2 font-serif text-5xl">{profile.status.replaceAll("_", " ")}</h1>
      <p className="mt-4 leading-7 text-mute">{copy[profile.status]}</p>
      {query.submitted ? <p className="mt-4 text-sm text-navy">Application submitted.</p> : null}
      {profile.moreInfoRequest ? <p className="mt-4 rounded-2xl bg-cream px-4 py-3">{profile.moreInfoRequest}</p> : null}
      <dl className="mt-8 grid gap-3 text-sm">
        <div><dt className="text-mute">University</dt><dd>{profile.university}</dd></div>
        <div><dt className="text-mute">Degree</dt><dd>{profile.degree} in {profile.major}, {profile.graduationYear}</dd></div>
        <div><dt className="text-mute">Subjects</dt><dd>{profile.subjects}</dd></div>
        <div><dt className="text-mute">Documents</dt><dd>{docs.map((doc) => doc.fileName).join(", ") || "None uploaded"}</dd></div>
      </dl>
      {profile.status !== "APPROVED" ? (
        <Link href="/become-a-tutor" className="btn btn-primary mt-8">Update application</Link>
      ) : (
        <Link href={`/tutors/${profile.slug}`} className="btn btn-primary mt-8">View public profile</Link>
      )}
    </div>
  );
}
