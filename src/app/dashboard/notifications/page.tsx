import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { markNotificationsRead } from "@/server/learning";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const db = await live();
  const notes = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 40 });
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-5xl">Notifications</h1>
        <form action={markNotificationsRead}><button className="btn btn-line" type="submit">Mark read</button></form>
      </div>
      <div className="mt-6 grid gap-3">
        {notes.map((note) => (
          <article key={note.id} className="rounded-2xl border border-line bg-paper px-4 py-3">
            <p className="font-medium">{note.title}</p>
            <p className="text-sm text-mute">{note.body}</p>
            <p className="mt-1 text-xs text-mute">{formatWhen(note.createdAt, user.timezone)}{note.readAt ? "" : " · new"}</p>
            {note.href ? <Link href={note.href} className="text-sm underline">Open</Link> : null}
          </article>
        ))}
        {!notes.length ? <p className="text-sm text-mute">You’re caught up.</p> : null}
      </div>
    </div>
  );
}
