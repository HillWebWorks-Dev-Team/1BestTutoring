import type { Metadata } from "next";
import Link from "next/link";
import { TutorCard } from "@/components/tutors/TutorCard";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import { toTutorCard } from "@/lib/cards";
import { live } from "@/lib/live";
import { UNIVERSITIES } from "@/lib/universities";

export const metadata: Metadata = { title: "Tutors" };
export const dynamic = "force-dynamic";

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    university?: string;
    grade?: string;
    max?: string;
    open?: string;
    sort?: string;
    page?: string;
    studentId?: string;
  }>;
}) {
  const params = await searchParams;
  const studentId = params.studentId?.trim() || undefined;
  const page = Math.max(1, Number(params.page || 1));
  const where = {
    status: "APPROVED",
    active: true,
    verified: true,
    ...(params.university ? { university: params.university } : {}),
    ...(params.subject ? { subjects: { contains: params.subject } } : {}),
    ...(params.grade ? { gradeLevels: { contains: params.grade } } : {}),
    ...(params.max ? { hourlyRateCents: { lte: Math.round(Number(params.max) * 100) } } : {}),
    ...(params.open ? { availability: { some: {} } } : {}),
    ...(params.q
      ? {
          OR: [
            { user: { name: { contains: params.q } } },
            { university: { contains: params.q } },
            { subjects: { contains: params.q } },
            { major: { contains: params.q } },
          ],
        }
      : {}),
  };
  const orderBy =
    params.sort === "rate-desc"
      ? [{ hourlyRateCents: "desc" as const }]
      : params.sort === "rate-asc"
        ? [{ hourlyRateCents: "asc" as const }]
        : params.sort === "name"
          ? [{ user: { name: "asc" as const } }]
          : [{ featured: "desc" as const }, { hourlyRateCents: "asc" as const }];

  const db = await live();
  const [tutors, total] = await Promise.all([
    db.tutorProfile.findMany({
      where,
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
        user: { select: { name: true, imageUrl: true } },
        reviews: { where: { published: true }, select: { rating: true } },
      },
      orderBy,
      skip: (page - 1) * 12,
      take: 12,
    }),
    db.tutorProfile.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 12));
  const query = clean(params);

  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="shell py-14 md:py-16">
          <p className="kicker">Tutor directory</p>
          <h1 className="display mt-3 max-w-3xl text-5xl text-ivory md:text-6xl">Find your tutor.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ivory/70">
            Approved, verified tutors only. Search by name, university, or subject, then book a free 15-minute
            consultation from any profile.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-10">
        <div className="shell grid gap-8 lg:grid-cols-[260px_1fr]">
          <details className="border border-line bg-white p-4 lg:hidden">
            <summary className="cursor-pointer font-medium text-navy">Filters</summary>
            <div className="mt-4">
              <FilterForm params={params} idPrefix="mobile" />
            </div>
          </details>

          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border border-line bg-white p-5">
              <p className="font-serif text-2xl text-navy">Filters</p>
              <div className="mt-4">
                <FilterForm params={params} idPrefix="desktop" />
              </div>
            </div>
          </aside>

          <div>
            <p className="text-sm text-mute">
              {total} tutor{total === 1 ? "" : "s"}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={toTutorCard(tutor)} studentId={studentId} />
              ))}
            </div>
            {!tutors.length ? <p className="mt-8 text-mute">No tutors match those filters yet.</p> : null}
            <div className="mt-8 flex gap-3">
              {page > 1 ? (
                <Link className="btn btn-line" href={`/tutors?${new URLSearchParams({ ...query, page: String(page - 1) })}`}>
                  Previous
                </Link>
              ) : null}
              {page < pages ? (
                <Link className="btn btn-line" href={`/tutors?${new URLSearchParams({ ...query, page: String(page + 1) })}`}>
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterForm({
  params,
  idPrefix,
}: {
  params: {
    q?: string;
    subject?: string;
    university?: string;
    grade?: string;
    max?: string;
    open?: string;
    sort?: string;
    studentId?: string;
  };
  idPrefix: string;
}) {
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  return (
    <form className="grid gap-3" action="/tutors">
      {params.studentId ? <input type="hidden" name="studentId" value={params.studentId} /> : null}
      <div>
        <label className="label" htmlFor={fieldId("q")}>
          Search
        </label>
        <input id={fieldId("q")} className="field" name="q" placeholder="Name, university, subject" defaultValue={params.q || ""} />
      </div>
      <div>
        <label className="label" htmlFor={fieldId("subject")}>
          Subject
        </label>
        <select id={fieldId("subject")} className="field" name="subject" defaultValue={params.subject || ""}>
          <option value="">All subjects</option>
          {SUBJECTS.map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={fieldId("university")}>
          University
        </label>
        <select id={fieldId("university")} className="field" name="university" defaultValue={params.university || ""}>
          <option value="">All universities</option>
          {UNIVERSITIES.map((school) => (
            <option key={school.name} value={school.name}>
              {school.short}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={fieldId("grade")}>
          Grade level
        </label>
        <select id={fieldId("grade")} className="field" name="grade" defaultValue={params.grade || ""}>
          <option value="">All grades</option>
          {GRADE_LEVELS.map((grade) => (
            <option key={grade}>{grade}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={fieldId("max")}>
          Max hourly rate
        </label>
        <input id={fieldId("max")} className="field" name="max" type="number" min="25" placeholder="150" defaultValue={params.max || ""} />
      </div>
      <div>
        <label className="label" htmlFor={fieldId("sort")}>
          Sort
        </label>
        <select id={fieldId("sort")} className="field" name="sort" defaultValue={params.sort || ""}>
          <option value="">Featured</option>
          <option value="rate-asc">Rate: low to high</option>
          <option value="rate-desc">Rate: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="open" value="1" defaultChecked={Boolean(params.open)} />
        Has hours listed
      </label>
      <button className="btn btn-primary" type="submit">
        Apply filters
      </button>
    </form>
  );
}

function clean(params: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]) && entry[0] !== "page"),
  );
}
