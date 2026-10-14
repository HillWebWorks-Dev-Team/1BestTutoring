import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/db";

const approved = { status: "APPROVED" as const, active: true, verified: true };

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

async function loadHomePayload() {
  const empty = {
    tutors: [] as Awaited<ReturnType<typeof fetchTutors>>,
    reviews: [] as Awaited<ReturnType<typeof fetchReviews>>,
  };

  return withTimeout(
    (async () => {
      const [tutors, reviews] = await Promise.all([fetchTutors(), fetchReviews()]);
      return { tutors, reviews };
    })(),
    8_000,
    empty,
  );
}

function fetchTutors() {
  return prisma.tutorProfile.findMany({
    where: approved,
    select: {
      id: true,
      slug: true,
      university: true,
      major: true,
      graduationYear: true,
      subjects: true,
      gradeLevels: true,
      hourlyRateCents: true,
      verified: true,
      featured: true,
      user: { select: { name: true, imageUrl: true } },
      reviews: { where: { published: true }, select: { rating: true } },
    },
    orderBy: [{ featured: "desc" }, { hourlyRateCents: "asc" }],
    take: 8,
  });
}

function fetchReviews() {
  return prisma.review.findMany({
    where: { published: true },
    select: {
      id: true,
      rating: true,
      comment: true,
      verified: true,
      author: { select: { name: true } },
      tutor: { select: { user: { select: { name: true } } } },
    },
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take: 9,
  });
}

const cachedHomePayload = unstable_cache(loadHomePayload, ["home-payload-v2"], {
  revalidate: 60,
  tags: ["home"],
});

/** Public homepage data — request-deduped + cached across refreshes. */
export const getHomePayload = cache(() => cachedHomePayload());
