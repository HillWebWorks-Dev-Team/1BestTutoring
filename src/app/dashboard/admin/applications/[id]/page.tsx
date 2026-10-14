import Link from "next/link";
import { notFound } from "next/navigation";
import { Portrait } from "@/components/brand";
import { ApplicationDecisionButtons } from "@/components/dashboard/ApplicationDecisionButtons";
import { hourly } from "@/lib/format";
import { live } from "@/lib/live";
import { rejectTutor, requestTutorInfo } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({
    where: { id },
    include: { user: { include: { documents: true } } },
  });
  if (!tutor) notFound();

  const photo = tutor.user.imageUrl;
  const docs = tutor.user.documents.filter((doc) => doc.kind !== "PROFILE_PHOTO");

  return (
    <div>
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/admin/applications" className="text-sm text-mute hover:text-navy">
        ← Back to queue
      </Link>

      <div className="mt-5 flex flex-wrap items-start gap-5">
        <Portrait
          name={tutor.user.name}
          src={photo}
          className="h-28 w-28 shrink-0 rounded-xl text-2xl"
        />
        <div className="min-w-0">
          <p className="kicker">{tutor.status.replaceAll("_", " ")}</p>
          <h1 className="mt-2 font-serif text-5xl text-navy">{tutor.user.name}</h1>
          <p className="mt-2 text-sm text-mute">
            {tutor.user.email}
            {tutor.linkedinUrl ? (
              <>
                {" · "}
                <a href={tutor.linkedinUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </>
            ) : null}
          </p>
          {!photo ? <p className="mt-2 text-sm text-[#7d332c]">No profile photo submitted.</p> : null}
        </div>
      </div>

      <dl className="mt-8 grid gap-4 border border-line bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-mute">University</dt>
          <dd className="mt-1 font-medium text-navy">{tutor.university}</dd>
        </div>
        <div>
          <dt className="text-mute">Degree / major</dt>
          <dd className="mt-1 font-medium text-navy">
            {tutor.degree} in {tutor.major} · {tutor.graduationYear}
          </dd>
        </div>
        <div>
          <dt className="text-mute">Hourly rate</dt>
          <dd className="mt-1 font-medium text-navy">{hourly(tutor.hourlyRateCents)}</dd>
        </div>
        <div>
          <dt className="text-mute">Subjects / grades</dt>
          <dd className="mt-1 font-medium text-navy">
            {tutor.subjects} · {tutor.gradeLevels}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-mute">Biography</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.bio}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-mute">Experience</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.experience}</dd>
        </div>
        <div>
          <dt className="text-mute">Education</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.education || "—"}</dd>
        </div>
        <div>
          <dt className="text-mute">Achievements</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.achievements || "—"}</dd>
        </div>
        <div>
          <dt className="text-mute">Certifications</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.certifications || "—"}</dd>
        </div>
        <div>
          <dt className="text-mute">Test scores</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.testScores || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-mute">Availability notes</dt>
          <dd className="mt-1 leading-6 text-navy">{tutor.availabilityNotes || "None"}</dd>
        </div>
      </dl>

      <div className="mt-6 border border-line bg-white p-5">
        <p className="font-serif text-2xl text-navy">Documents</p>
        <ul className="mt-3 space-y-2 text-sm">
          {docs.map((doc) => (
            <li key={doc.id}>
              <a className="text-navy underline underline-offset-2" href={`/api/documents/${doc.id}`}>
                {doc.kind}: {doc.fileName}
              </a>
            </li>
          ))}
          {!docs.length ? <li className="text-mute">No documents uploaded.</li> : null}
        </ul>
      </div>

      <form action={requestTutorInfo} className="mt-6 grid gap-2 border border-line bg-white p-5">
        <p className="font-serif text-2xl text-navy">Request more information</p>
        <input type="hidden" name="tutorId" value={tutor.id} />
        <textarea className="field min-h-24" name="note" placeholder="What else do you need?" />
        <button className="btn btn-line w-fit" type="submit">
          Request information
        </button>
      </form>

      <form action={rejectTutor} className="mt-4 grid gap-2 border border-line bg-white p-5">
        <p className="font-serif text-2xl text-navy">Reject</p>
        <input type="hidden" name="tutorId" value={tutor.id} />
        <textarea className="field min-h-20" name="note" placeholder="Internal note" />
        <button className="btn btn-danger w-fit" type="submit">
          Reject
        </button>
      </form>

      <div className="h-4" aria-hidden />
    </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <ApplicationDecisionButtons tutorId={tutor.id} tutorName={tutor.user.name} />
      </div>
    </div>
  );
}
