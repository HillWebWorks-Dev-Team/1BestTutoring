import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Portrait, UniversityMark } from "@/components/brand";
import { Notice, Stars } from "@/components/ui";
import { canBookPaidSession, isPublicTutor } from "@/lib/access";
import { splitList } from "@/lib/brand";
import { hourly, ratingOf } from "@/lib/format";
import { live } from "@/lib/live";
import { getSession } from "@/lib/session";
import { portraitFor } from "@/lib/portraits";
import { UNIVERSITY_DISCLAIMER } from "@/lib/universities";
import { youtubeId } from "@/lib/zoom";
import { requestTutor } from "@/server/booking";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replaceAll("-", " ") };
}

export default async function TutorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; studentId?: string; reviewed?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const db = await live();
  const tutor = await db.tutorProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      reviews: { where: { published: true }, include: { author: true }, orderBy: { createdAt: "desc" } },
      availability: true,
    },
  });
  if (!tutor || !isPublicTutor(tutor)) notFound();
  const session = await getSession();
  const viewer = session
    ? await db.user.findUnique({
        where: { id: session.uid },
        include: { studentProfile: true, parentProfile: { include: { students: { include: { user: true } } } } },
      })
    : null;
  const linkedIds = new Set(viewer?.parentProfile?.students.map((s) => s.id) || []);
  const studentId =
    (query.studentId && (viewer?.studentProfile?.id === query.studentId || linkedIds.has(query.studentId))
      ? query.studentId
      : null) ||
    viewer?.studentProfile?.id ||
    viewer?.parentProfile?.students[0]?.id;
  const studentQs = studentId ? `&studentId=${encodeURIComponent(studentId)}` : "";
  const assignment = studentId
    ? await db.assignment.findUnique({ where: { studentId_tutorId: { studentId, tutorId: tutor.id } } })
    : null;
  const rating = ratingOf(tutor.reviews.map((review) => review.rating));
  const video = youtubeId(tutor.introVideoUrl);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_340px]">
      <div className="order-2 space-y-8 lg:order-1">
        <Notice
          error={query.error}
          success={query.reviewed ? "Thanks — your review is live on this profile." : undefined}
        />
        <section>
          <p className="kicker">Biography</p>
          <p className="mt-3 max-w-3xl text-lg leading-8">{tutor.bio}</p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <Info title="Education" body={tutor.education} />
          <Info title="Tutoring experience" body={tutor.experience} />
          <Info title="Achievements" body={tutor.achievements} />
          <Info title="Scores and credentials" body={[tutor.testScores, tutor.certifications].filter(Boolean).join("\n")} />
        </section>
        <section>
          <p className="kicker">Teaches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {splitList(tutor.subjects).map((subject) => (
              <Link key={subject} href={`/tutors?subject=${encodeURIComponent(subject)}`} className="rounded-full border border-line bg-paper px-3 py-1 text-sm">
                {subject}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-mute">Grade levels: {splitList(tutor.gradeLevels).join(", ")}</p>
        </section>
        <section>
          <p className="kicker">Consultation hours</p>
          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            {tutor.availability.map((rule) => (
              <li key={rule.id} className="rounded-xl border border-line bg-paper px-3 py-2">
                {days[rule.dayOfWeek]} · {minutes(rule.startMin)}–{minutes(rule.endMin)}
              </li>
            ))}
          </ul>
          {tutor.availabilityNotes ? <p className="mt-3 text-sm text-mute">{tutor.availabilityNotes}</p> : null}
        </section>
        {video ? (
          <section>
            <p className="kicker">Introduction</p>
            <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-navy">
              <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${video}`} title="Introduction video" allowFullScreen />
            </div>
          </section>
        ) : null}
        <section>
          <p className="kicker">Reviews</p>
          <div className="mt-4 grid gap-3">
            {tutor.reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} />
                  {review.verified ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Verified session</span>
                  ) : null}
                </div>
                <p className="mt-2 leading-7">{review.comment}</p>
                <p className="mt-2 text-xs text-mute">{review.author.name}</p>
              </article>
            ))}
            {!tutor.reviews.length ? <p className="text-sm text-mute">Reviews appear after completed tutoring sessions.</p> : null}
          </div>
        </section>
        <section id="request" className="card p-6">
          <p className="kicker">Continue after the consultation</p>
          <h2 className="mt-2 font-serif text-3xl">Request this tutor</h2>
          <p className="mt-2 text-sm leading-6 text-mute">
            This does not assign anyone. Our team reviews the request and makes the match.
          </p>
          {viewer ? (
            <form action={requestTutor} className="mt-4 grid gap-3">
              <input type="hidden" name="slug" value={tutor.slug} />
              {viewer.parentProfile && viewer.parentProfile.students.length > 1 ? (
                <select className="field" name="studentId" aria-label="Student" defaultValue={studentId}>
                  {viewer.parentProfile.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user.name}
                    </option>
                  ))}
                </select>
              ) : studentId ? (
                <input type="hidden" name="studentId" value={studentId} />
              ) : null}
              <textarea className="field min-h-28" name="message" placeholder="What do you want to work on, and why this tutor?" required />
              <textarea className="field min-h-20" name="goals" placeholder="Academic goals" defaultValue={viewer.studentProfile?.goals || ""} />
              <button className="btn btn-primary w-fit" type="submit">
                Send request
              </button>
            </form>
          ) : (
            <Link href={`/login?next=/tutors/${tutor.slug}`} className="btn btn-primary mt-4">
              Sign in to request
            </Link>
          )}
        </section>
      </div>
      <aside className="order-1 h-fit lg:sticky lg:top-24 lg:order-2">
        <div className="card overflow-hidden">
          <Portrait name={tutor.user.name} src={portraitFor(tutor.slug, tutor.user.imageUrl)} className="aspect-[4/5] h-auto w-full rounded-none text-3xl" />
          <div className="p-5">
            <h1 className="font-serif text-4xl leading-none">{tutor.user.name}</h1>
            {tutor.verified ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Verified tutor</p>
            ) : null}
            <p className="mt-3 text-sm text-mute">
              {tutor.degree} in {tutor.major}
              <span className="block">Class of {tutor.graduationYear}</span>
            </p>
            <div className="mt-4">
              <UniversityMark university={tutor.university} />
            </div>
            <p className="mt-5 font-serif text-4xl">{hourly(tutor.hourlyRateCents)}</p>
            <p className="text-sm text-mute">
              {rating ? (
                <>
                  <Stars value={rating} /> {rating} · {tutor.reviews.length} review{tutor.reviews.length === 1 ? "" : "s"}
                </>
              ) : (
                "No reviews yet"
              )}
            </p>
            <div className="mt-5 grid gap-2">
              <Link href={`/tutors/${tutor.slug}/book?type=consultation${studentQs}`} className="btn btn-primary">
                Book a free consultation
              </Link>
              <Link
                href={
                  canBookPaidSession(assignment?.status === "ACTIVE")
                    ? `/tutors/${tutor.slug}/book?type=session${studentQs}`
                    : "#request"
                }
                className="btn btn-line"
              >
                {assignment?.status === "ACTIVE" ? "Book a paid session" : "Request ongoing tutoring"}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-mute">{UNIVERSITY_DISCLAIMER}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <article className="rounded-3xl border border-line p-5">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-mute">{body}</p>
    </article>
  );
}

function minutes(value: number) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${mins.toString().padStart(2, "0")} ${suffix}`;
}
