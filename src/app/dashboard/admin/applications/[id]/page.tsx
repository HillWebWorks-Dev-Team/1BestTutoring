import Link from "next/link";
import { notFound } from "next/navigation";
import { hourly } from "@/lib/format";
import { live } from "@/lib/live";
import { approveTutor, rejectTutor, requestTutorInfo, waitlistTutor } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({ where: { id }, include: { user: { include: { documents: true } } } });
  if (!tutor) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/admin/applications" className="text-sm text-mute">Back to queue</Link>
      <h1 className="mt-3 font-serif text-5xl">{tutor.user.name}</h1>
      <p className="mt-2 text-mute">{tutor.user.email} · {tutor.status}</p>
      <div className="mt-6 space-y-3 text-sm leading-6">
        <p>{tutor.degree} in {tutor.major}, {tutor.university}, {tutor.graduationYear}</p>
        <p>{hourly(tutor.hourlyRateCents)} · {tutor.subjects} · {tutor.gradeLevels}</p>
        <p>{tutor.bio}</p>
        <p>{tutor.experience}</p>
        <p>{tutor.achievements}</p>
        <p>Availability notes: {tutor.availabilityNotes || "None"}</p>
      </div>
      <ul className="mt-4 text-sm">
        {tutor.user.documents.map((doc) => (
          <li key={doc.id}><a className="underline" href={`/api/documents/${doc.id}`}>{doc.kind}: {doc.fileName}</a></li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-2">
        <form action={approveTutor}><input type="hidden" name="tutorId" value={tutor.id} /><button className="btn btn-primary" type="submit">Approve</button></form>
        <form action={waitlistTutor}><input type="hidden" name="tutorId" value={tutor.id} /><button className="btn btn-line" type="submit">Waitlist</button></form>
      </div>
      <form action={requestTutorInfo} className="mt-4 grid gap-2">
        <input type="hidden" name="tutorId" value={tutor.id} />
        <textarea className="field" name="note" placeholder="What else do you need?" />
        <button className="btn btn-line w-fit" type="submit">Request information</button>
      </form>
      <form action={rejectTutor} className="mt-4 grid gap-2">
        <input type="hidden" name="tutorId" value={tutor.id} />
        <textarea className="field" name="note" placeholder="Internal note" />
        <button className="btn btn-danger w-fit" type="submit">Reject</button>
      </form>
    </div>
  );
}
