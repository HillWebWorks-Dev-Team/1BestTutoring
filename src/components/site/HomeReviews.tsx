"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  verified?: boolean;
  author: { name: string };
  tutor: { user: { name: string } };
  example?: boolean;
};

const EXAMPLE_REVIEWS: Review[] = [
  { subject: "Mathematics", comment: "Working through each step helped me understand the method, instead of just memorising an answer." },
  { subject: "English", comment: "The feedback gave me a clear starting point for revising my essay and organising my ideas." },
  { subject: "Science", comment: "Connecting the concepts to everyday examples made the material easier to follow." },
  { subject: "Exam preparation", comment: "Breaking practice questions into smaller steps made my study sessions more focused." },
  { subject: "Study skills", comment: "A manageable weekly plan helped me decide what to work on next." },
  { subject: "Computer science", comment: "Talking through the code helped me see why it worked and how to find mistakes." },
].map(({ subject, comment }, index) => ({
  id: `example-review-${index}`,
  rating: 0,
  comment,
  author: { name: subject },
  tutor: { user: { name: "" } },
  example: true,
}));

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [start, setStart] = useState(0);
  const cards = [...reviews, ...EXAMPLE_REVIEWS.slice(0, Math.max(0, 6 - reviews.length))];
  const ordered = [...cards.slice(start), ...cards.slice(0, start)].slice(0, 3);
  const move = (direction: number) => setStart((current) => (current + direction + cards.length) % cards.length);
  const realCount = reviews.length;

  return (
    <section id="reviews" className="bg-ivory py-12 sm:py-16" aria-labelledby="reviews-heading">
      <div className="shell">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="kicker">Student stories</p>
            <h2 id="reviews-heading" className="display mt-3 text-3xl text-navy sm:text-4xl md:text-5xl">From completed sessions.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
              {realCount
                ? `${realCount} published review${realCount === 1 ? "" : "s"} from finished tutoring sessions.`
                : "Published only after a finished tutoring session."}
            </p>
            {cards.some((card) => card.example) ? <p className="mt-1 text-xs leading-5 text-mute">Cards marked “Example” contain illustrative text, not student testimonials.</p> : null}
          </div>
          <div className="flex shrink-0 gap-2">
            {[{ direction: -1, label: "Previous reviews", Icon: ChevronLeft }, { direction: 1, label: "Next reviews", Icon: ChevronRight }].map(({ direction, label, Icon }) => (
              <button key={label} type="button" aria-label={label} disabled={cards.length <= 3} onClick={() => move(direction)} className="grid h-9 w-9 place-items-center rounded-full border border-navy/15 text-navy transition hover:bg-white disabled:cursor-default disabled:opacity-40">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        {cards.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-3" aria-live="polite">
            {ordered.map((review) => (
              <figure key={review.id} className="flex flex-col rounded-lg border border-navy/5 bg-white px-5 py-6 shadow-sm sm:px-6">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="font-serif text-4xl leading-none text-gold">“</span>
                  <blockquote className="text-sm leading-6 text-navy">{review.comment}</blockquote>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                  <div className="flex flex-col gap-1.5">
                    {review.example ? (
                      <span className="w-fit rounded-full bg-ivory px-2 py-1 text-xs font-medium text-navy">Example</span>
                    ) : (
                      <p className="shrink-0 text-sm tracking-widest text-gold" aria-label={`${review.rating} out of 5 stars`}>
                        {"★".repeat(review.rating)}
                      </p>
                    )}
                    {!review.example && review.verified ? (
                      <span className="w-fit text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Verified session</span>
                    ) : null}
                  </div>
                  <figcaption className="text-right text-xs leading-5">
                    <strong className="block font-semibold text-navy">{review.author.name}</strong>
                    <span className="text-mute">{review.example ? "Illustrative review" : `Student · session with ${review.tutor.user.name}`}</span>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        ) : <p className="mt-7 text-sm text-mute">Reviews will appear here after students finish sessions.</p>}
      </div>
    </section>
  );
}
