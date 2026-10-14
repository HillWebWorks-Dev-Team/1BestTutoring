import Link from "next/link";
import { Notice, Stars } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireRole } from "@/lib/session";
import { setReviewPublished } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; hidden?: string; error?: string; filter?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const query = await searchParams;
  const filter = query.filter === "hidden" || query.filter === "all" ? query.filter : "published";
  const db = await live();
  const reviews = await db.review.findMany({
    where: filter === "all" ? {} : { published: filter === "published" },
    include: {
      author: true,
      tutor: { include: { user: true } },
      booking: true,
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const [publishedCount, hiddenCount] = await Promise.all([
    db.review.count({ where: { published: true } }),
    db.review.count({ where: { published: false } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Trust loop</p>
          <h1 className="mt-2 font-serif text-5xl">Reviews</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
            Publish or hide student feedback. Hidden reviews leave tutor averages and the homepage.
          </p>
        </div>
        <p className="text-sm text-mute">
          {publishedCount} live · {hiddenCount} hidden
        </p>
      </div>

      <div className="my-4">
        <Notice
          error={query.error}
          success={
            query.published ? "Review published." : query.hidden ? "Review hidden from public pages." : undefined
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/dashboard/admin/reviews" label="Published" active={filter === "published"} />
        <FilterChip href="/dashboard/admin/reviews?filter=hidden" label="Hidden" active={filter === "hidden"} />
        <FilterChip href="/dashboard/admin/reviews?filter=all" label="All" active={filter === "all"} />
      </div>

      <div className="mt-6 grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} />
                  {review.verified ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Verified session</span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      review.published ? "bg-navy text-ivory" : "border border-line bg-ivory text-mute"
                    }`}
                  >
                    {review.published ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-navy">{review.comment}</p>
                <p className="mt-2 text-xs text-mute">
                  {review.author.name} · session with {review.tutor.user.name} ·{" "}
                  {formatWhen(review.createdAt, "America/New_York", false)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {review.bookingId ? (
                  <Link className="btn btn-line !px-3 !py-1.5 text-xs" href={`/dashboard/bookings/${review.bookingId}`}>
                    Booking
                  </Link>
                ) : null}
                <Link className="btn btn-line !px-3 !py-1.5 text-xs" href={`/tutors/${review.tutor.slug}`}>
                  Profile
                </Link>
                <form action={setReviewPublished}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="published" value={review.published ? "0" : "1"} />
                  <button className="btn btn-primary !px-3 !py-1.5 text-xs" type="submit">
                    {review.published ? "Hide" : "Publish"}
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
        {!reviews.length ? (
          <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-8 text-sm text-mute">
            No reviews in this filter yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active ? "border-navy bg-navy text-ivory" : "border-line bg-white text-navy hover:border-navy/40"
      }`}
    >
      {label}
    </Link>
  );
}
