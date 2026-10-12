import Link from "next/link";
import { live } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
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
      <h1 className="font-serif text-5xl">Applications</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link key={item} href={`/dashboard/admin/applications?status=${item}`} className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${status === item ? "bg-navy text-ivory" : "bg-mist"}`}>
            {item}
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-3">
        {tutors.map((tutor) => (
          <Link key={tutor.id} href={`/dashboard/admin/applications/${tutor.id}`} className="card block p-4">
            <span className="font-serif text-2xl">{tutor.user.name}</span>
            <span className="mt-1 block text-sm text-mute">{tutor.university} · {tutor.major} · {tutor.status}</span>
          </Link>
        ))}
        {!tutors.length ? <p className="text-sm text-mute">Nothing in this queue.</p> : null}
      </div>
    </div>
  );
}
