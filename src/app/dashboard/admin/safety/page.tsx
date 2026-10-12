import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { resolveSafety } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function SafetyDesk() {
  const db = await live();
  const reports = await db.safetyReport.findMany({ include: { reporter: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-5xl">Safety</h1>
      <div className="mt-6 grid gap-3">
        {reports.map((report) => (
          <article key={report.id} className="card p-5">
            <p className="kicker">{report.status} · {report.reason}</p>
            <p className="mt-2 text-sm text-mute">{report.reporter.name} · {formatWhen(report.createdAt)}</p>
            <p className="mt-3 text-sm leading-6">{report.details}</p>
            <form action={resolveSafety} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={report.id} />
              <button className="btn btn-line" name="status" value="REVIEWING" type="submit">Reviewing</button>
              <button className="btn btn-primary" name="status" value="RESOLVED" type="submit">Resolve</button>
            </form>
          </article>
        ))}
        {!reports.length ? <p className="text-sm text-mute">No reports.</p> : null}
      </div>
    </div>
  );
}
