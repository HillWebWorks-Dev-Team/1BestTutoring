import Link from "next/link";
import { Portrait, UniversityMark } from "@/components/brand";
import { Stars } from "@/components/ui";
import { hourly } from "@/lib/format";

export type TutorCardData = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  university: string;
  major: string;
  graduationYear: number;
  subjects: string[];
  gradeLevels: string[];
  hourlyRateCents: number;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
};

export function TutorCard({ tutor }: { tutor: TutorCardData }) {
  return (
    <Link
      href={`/tutors/${tutor.slug}`}
      aria-label={`View ${tutor.name}'s profile`}
      className="card flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-gold/50 focus-visible:border-gold"
    >
      <div className="relative">
        <Portrait name={tutor.name} src={tutor.imageUrl} className="aspect-[4/5] h-auto w-full rounded-none text-3xl" />
        {tutor.verified ? (
          <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy">
            Verified
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-[1.65rem] leading-none tracking-tight">{tutor.name}</h3>
        <p className="mt-2 text-sm text-mute">
          {tutor.major} · {tutor.graduationYear}
        </p>
        <div className="mt-3">
          <UniversityMark university={tutor.university} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tutor.subjects.slice(0, 3).map((subject) => (
            <span key={subject} className="rounded-full border border-line bg-ivory px-2.5 py-1 text-xs">
              {subject}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="font-serif text-2xl text-navy">{hourly(tutor.hourlyRateCents)}</p>
            <p className="text-xs text-mute">
              {tutor.rating ? (
                <>
                  <Stars value={tutor.rating} /> {tutor.rating} · {tutor.reviewCount} review{tutor.reviewCount === 1 ? "" : "s"}
                </>
              ) : (
                "No reviews yet"
              )}
            </p>
          </div>
          <span className="btn btn-line pointer-events-none shrink-0 whitespace-nowrap">View profile</span>
        </div>
      </div>
    </Link>
  );
}
