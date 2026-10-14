import Link from "next/link";
import { Portrait } from "@/components/brand";
import { Notice } from "@/components/ui";
import { live } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const db = await live();
  const status = params.status || "PENDING";
  const tutors = await db.tutorProfile.findMany({
    where: status === "ALL" ? {} : { status },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  const filters = ["PENDING", "WAITLISTED", "MORE_INFO", "APPROVED", "REJECTED", "ALL"];
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-5xl text-navy">Applications</h1>
      <div className="my-4">
        <Notice success={params.updated ? "Application updated." : undefined} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link
            key={item}
            href={`/dashboard/admin/applications?status=${item}`}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider ${
              status === item ? "bg-navy text-ivory" : "border border-line bg-white text-navy"
            }`}
          >
            {item.replaceAll("_", " ")}
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-3">
        {tutors.map((tutor) => (
          <Link
            key={tutor.id}
            href={`/dashboard/admin/applications/${tutor.id}`}
            className="flex items-center gap-4 border border-line bg-white p-4 transition hover:border-navy/30"
          >
            <Portrait
              name={tutor.user.name}
              src={tutor.user.imageUrl}
              className="h-14 w-14 shrink-0 rounded-xl text-sm"
            />
            <span className="min-w-0">
              <span className="block font-serif text-2xl text-navy">{tutor.user.name}</span>
              <span className="mt-1 block text-sm text-mute">
                {tutor.university} · {tutor.major} · {tutor.status.replaceAll("_", " ")}
              </span>
            </span>
          </Link>
        ))}
        {!tutors.length ? <p className="text-sm text-mute">Nothing in this queue.</p> : null}
      </div>
    </div>
  );
}
