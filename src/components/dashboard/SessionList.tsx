import Link from "next/link";
import { cancelBooking } from "@/server/booking";
import { saveReport, saveReview } from "@/server/learning";
import { formatWhen, money } from "@/lib/format";
import { canLeaveReview } from "@/lib/reviews";

export type SessionItem = {
  id: string;
  type: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  tutorName: string;
  tutorSlug: string;
  studentName: string;
  hasReport: boolean;
  hasReview: boolean;
};

export function SessionList({
  items,
  role,
  timeZone,
  compact = false,
}: {
  items: SessionItem[];
  role: "STUDENT" | "TUTOR" | "PARENT" | "ADMIN";
  timeZone: string;
  compact?: boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-mute">Nothing on the calendar yet.</p>;
  }
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const join = role === "TUTOR" ? item.zoomStartUrl || item.zoomJoinUrl : item.zoomJoinUrl;
        const upcoming = item.status === "CONFIRMED" && item.endsAt.getTime() > Date.now();
        const label = item.type === "CONSULTATION" ? "Consultation" : "Session";
        const person = role === "TUTOR" ? item.studentName : item.tutorName;
        const btn = compact ? "btn btn-line !px-3 !py-2 text-sm whitespace-nowrap" : "btn btn-line whitespace-nowrap";
        const btnPrimary = compact ? "btn btn-primary !px-3 !py-2 text-sm whitespace-nowrap" : "btn btn-primary whitespace-nowrap";

        return (
          <article key={item.id} className={`card ${compact ? "p-4" : "p-5"}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                {label} · {item.status.replaceAll("_", " ").toLowerCase()}
              </p>
              <h3 className={`mt-1.5 font-serif leading-tight ${compact ? "text-[1.65rem]" : "text-3xl"}`}>{person}</h3>
              <p className="mt-1.5 text-sm text-mute">
                {formatWhen(item.startsAt, timeZone)} · {item.priceCents ? money(item.priceCents) : "Free"}
              </p>
            </div>

            <div className={`mt-4 grid gap-2 ${compact ? "grid-cols-2" : "flex flex-wrap"}`}>
              {join && item.status === "CONFIRMED" ? (
                <a className={`${btnPrimary} ${compact ? "col-span-2" : ""}`} href={join} target="_blank" rel="noreferrer">
                  Join Zoom
                </a>
              ) : null}
              <a className={btn} href={`/api/bookings/${item.id}/calendar`}>
                Add to calendar
              </a>
              {role !== "TUTOR" ? (
                <Link className={btn} href={`/tutors/${item.tutorSlug}`}>
                  Profile
                </Link>
              ) : null}
            </div>

            {!item.zoomJoinUrl && item.status === "CONFIRMED" && !compact ? (
              <p className="mt-3 text-xs text-mute">Zoom link appears once Zoom is connected.</p>
            ) : null}

            {upcoming ? (
              <div className={`mt-3 grid gap-2 border-t border-line pt-3 ${compact ? "grid-cols-2" : "flex flex-wrap"}`}>
                <Link
                  className={btn}
                  href={`/tutors/${item.tutorSlug}/book?type=${item.type === "CONSULTATION" ? "consultation" : "session"}&reschedule=${item.id}`}
                >
                  Reschedule
                </Link>
                <details className="group">
                  <summary className={`${btn} w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>Cancel</summary>
                  <form action={cancelBooking} className="col-span-2 mt-2 grid gap-2 rounded-xl border border-line bg-ivory p-3">
                    <input type="hidden" name="bookingId" value={item.id} />
                    <input className="field" name="reason" placeholder="Reason for cancelling" required />
                    <button className="btn btn-danger" type="submit">
                      Confirm cancel
                    </button>
                  </form>
                </details>
              </div>
            ) : null}

            {role === "TUTOR" && item.type === "SESSION" && item.status !== "CANCELLED" && item.status !== "REFUNDED" ? (
              <details className="mt-3 border-t border-line pt-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {item.hasReport ? "Update session report" : "Write session report"}
                </summary>
                <form action={saveReport} className="mt-3 grid gap-3">
                  <input type="hidden" name="bookingId" value={item.id} />
                  <textarea className="field min-h-20" name="topics" placeholder="Topics covered" required />
                  <textarea className="field min-h-20" name="performance" placeholder="How the student did" required />
                  <textarea className="field min-h-20" name="improvements" placeholder="Areas to improve" />
                  <textarea className="field min-h-20" name="recommendations" placeholder="What to do before next time" />
                  <button className="btn btn-primary w-fit" type="submit">
                    Save report and complete session
                  </button>
                </form>
              </details>
            ) : null}

            {role === "STUDENT" && item.type === "SESSION" && item.hasReview ? (
              <p className="mt-3 border-t border-line pt-3 text-sm text-mute">Thanks - your review is published.</p>
            ) : null}

            {role === "STUDENT" &&
            canLeaveReview({
              type: item.type,
              status: item.status,
              endsAt: item.endsAt,
              review: item.hasReview ? { id: true } : null,
            }) ? (
              <form action={saveReview} className="mt-3 grid gap-3 border-t border-line pt-3">
                <div>
                  <p className="text-sm font-semibold text-navy">Share feedback</p>
                  <p className="mt-1 text-xs text-mute">
                    Your confirmed session has ended. Reviews appear on the tutor’s public profile.
                  </p>
                </div>
                <input type="hidden" name="bookingId" value={item.id} />
                <label className="label" htmlFor={`rating-${item.id}`}>
                  Rating
                </label>
                <select id={`rating-${item.id}`} className="field" name="rating" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((score) => (
                    <option key={score} value={score}>
                      {score} star{score === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
                <label className="label" htmlFor={`comment-${item.id}`}>
                  Comment
                </label>
                <textarea
                  id={`comment-${item.id}`}
                  className="field min-h-20"
                  name="comment"
                  placeholder="What should the next family know?"
                  minLength={8}
                  required
                />
                <button className="btn btn-primary" type="submit">
                  Publish review
                </button>
              </form>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
