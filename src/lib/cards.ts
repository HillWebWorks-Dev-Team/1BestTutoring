import { splitList } from "@/lib/brand";
import { ratingOf } from "@/lib/format";
import { portraitFor } from "@/lib/portraits";

export function toTutorCard(tutor: {
  slug: string;
  university: string;
  major: string;
  graduationYear: number;
  subjects: string;
  gradeLevels: string;
  hourlyRateCents: number;
  verified: boolean;
  user: { name: string; imageUrl: string | null };
  reviews: { rating: number }[];
}) {
  const ratings = tutor.reviews.map((review) => review.rating);
  return {
    slug: tutor.slug,
    name: tutor.user.name,
    imageUrl: portraitFor(tutor.slug, tutor.user.imageUrl),
    university: tutor.university,
    major: tutor.major,
    graduationYear: tutor.graduationYear,
    subjects: splitList(tutor.subjects),
    gradeLevels: splitList(tutor.gradeLevels),
    hourlyRateCents: tutor.hourlyRateCents,
    rating: ratingOf(ratings),
    reviewCount: ratings.length,
    verified: tutor.verified,
  };
}
