import { redirect } from "next/navigation";
import { AvailabilityBoard } from "@/components/dashboard/AvailabilityBoard";
import { Notice } from "@/components/ui";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const user = await requireUser();
  if (user.tutorProfile?.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const db = await live();
  const [rules, blocks] = await Promise.all([
    db.availabilityRule.findMany({ where: { tutorId: user.tutorProfile.id }, orderBy: { startMin: "asc" } }),
    db.availabilityBlock.findMany({ where: { tutorId: user.tutorProfile.id }, orderBy: { date: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="kicker">Schedule</p>
      <h1 className="mt-2 font-serif text-5xl text-navy">Availability</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
        Set the hours students can book you. Times use your time zone ({user.timezone.replaceAll("_", " ")}).
        Free consultations are 15 minutes; tutoring sessions use the platform session length.
      </p>
      <div className="my-5">
        <Notice error={query.error} success={query.saved ? "Availability updated." : undefined} />
      </div>
      <AvailabilityBoard
        timezone={user.timezone}
        initialRules={rules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startMin: rule.startMin,
          endMin: rule.endMin,
        }))}
        blocks={blocks.map((block) => ({
          id: block.id,
          date: block.date,
          reason: block.reason,
        }))}
      />
    </div>
  );
}
