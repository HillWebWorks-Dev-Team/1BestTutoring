import Link from "next/link";
import { Notice } from "@/components/ui";
import { SessionList, type SessionItem } from "@/components/dashboard/SessionList";
import { live } from "@/lib/live";
import { reviewableBookingWhere } from "@/lib/reviews";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function StudentReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reviewed?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  const studentId = user.studentProfile?.id || "";
  const db = await live();

  const [needsReview, published] = await Promise.all([
    studentId
      ? db.booking.findMany({
          where: reviewableBookingWhere(studentId),
          include: { tutor: { include: { user: true } }, student: { include: { user: true } }, report: true, review: true },
          orderBy: { startsAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    studentId
      ? db.review.findMany({
          where: { authorId: user.id },
          include: { tutor: { include: { user: true } }, booking: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker">Feedback</p>
      <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">Reviews</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
        After a confirmed tutoring session ends, leave a short review for that tutor. Published reviews help the next
        family choose with confidence.
      </p>

      <div className="mt-4">
        <Notice
          success={query.reviewed ? "Thanks - your review is live on the tutor’s profile." : undefined}
          error={query.error}
        />
      </div>

      <section className="mt-8" id="leave-review">
        <h2 className="font-serif text-2xl text-navy">Awaiting your review</h2>
        <p className="mt-2 text-sm text-mute">Sessions that have ended and still need your feedback.</p>
        <div className="mt-4">
          {needsReview.length ? (
            <SessionList items={needsReview.map(toItem)} role="STUDENT" timeZone={user.timezone} />
          ) : (
            <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-mute">
              Nothing waiting right now. When a confirmed paid session ends, it will show up here.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-navy">Your published reviews</h2>
        <div className="mt-4 grid gap-3">
          {published.length ? (
            published.map((review) => (
              <article key={review.id} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                  {review.rating} star{review.rating === 1 ? "" : "s"}
                  {review.published ? " · published" : " · hidden"}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-navy">{review.tutor.user.name}</h3>
                <p className="mt-2 text-sm leading-6 text-navy">{review.comment}</p>
                <Link href={`/tutors/${review.tutor.slug}`} className="mt-3 inline-block text-sm text-mute hover:text-navy">
                  View tutor profile
                </Link>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-mute">
              You haven’t published a review yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function toItem(booking: {
  id: string;
  type: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  tutor: { slug: string; user: { name: string } };
  student: { user: { name: string } };
  report: { id: string } | null;
  review: { id: string } | null;
}): SessionItem {
  return {
    id: booking.id,
    type: booking.type,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    priceCents: booking.priceCents,
    zoomJoinUrl: booking.zoomJoinUrl,
    zoomStartUrl: booking.zoomStartUrl,
    tutorName: booking.tutor.user.name,
    tutorSlug: booking.tutor.slug,
    studentName: booking.student.user.name,
    hasReport: Boolean(booking.report),
    hasReview: Boolean(booking.review),
  };
}
