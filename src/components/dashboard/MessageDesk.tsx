import Link from "next/link";
import { Pin } from "lucide-react";
import { Portrait } from "@/components/brand";
import { ReportForm } from "@/components/dashboard/ReportForm";
import { canMessagePair, canReadHistory } from "@/lib/access";
import { formatWhen } from "@/lib/format";
import { live } from "@/lib/live";
import { portraitFor } from "@/lib/portraits";
import { markConversationUnread, sendMessage, toggleConversationPin } from "@/server/learning";

export async function MessageDesk({
  userId,
  role,
  otherId,
  timeZone = "America/New_York",
}: {
  userId: string;
  role: "STUDENT" | "TUTOR";
  otherId?: string;
  timeZone?: string;
}) {
  const db = await live();
  const me = await db.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true, tutorProfile: true },
  });
  if (!me) return null;

  const assignments = await db.assignment.findMany({
    where:
      role === "STUDENT"
        ? { studentId: me.studentProfile?.id || "__none" }
        : { tutorId: me.tutorProfile?.id || "__none" },
    include: {
      student: { include: { user: true } },
      tutor: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pins = await db.pinnedConversation.findMany({
    where: { userId },
    select: { otherUserId: true },
  });
  const pinnedIds = new Set(pins.map((pin) => pin.otherUserId));

  const people = [];
  for (const assignment of assignments) {
    const person = role === "STUDENT" ? assignment.tutor.user : assignment.student.user;
    const slug = role === "STUDENT" ? assignment.tutor.slug : null;
    const last = await db.message.findFirst({
      where: {
        OR: [
          { senderId: userId, recipientId: person.id },
          { senderId: person.id, recipientId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    const unread = await db.message.count({
      where: { recipientId: userId, senderId: person.id, readAt: null },
    });
    const hasIncoming = Boolean(
      await db.message.findFirst({
        where: { recipientId: userId, senderId: person.id },
        select: { id: true },
      }),
    );
    people.push({
      id: person.id,
      name: person.name,
      imageUrl: portraitFor(slug, person.imageUrl),
      active: assignment.status === "ACTIVE",
      lastBody: last?.body || "No messages yet",
      lastAt: last?.createdAt || null,
      unread,
      hasIncoming,
      pinned: pinnedIds.has(person.id),
    });
  }

  people.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const aTime = a.lastAt?.getTime() || 0;
    const bTime = b.lastAt?.getTime() || 0;
    return bTime - aTime;
  });

  const selected = people.find((person) => person.id === otherId) || people[0];
  const assignment = selected
    ? assignments.find((item) => (role === "STUDENT" ? item.tutor.userId : item.student.userId) === selected.id)
    : null;
  const messages = selected
    ? await db.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: selected.id },
            { senderId: selected.id, recipientId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  if (selected) {
    await db.message.updateMany({
      where: { recipientId: userId, senderId: selected.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  const base = role === "STUDENT" ? "/dashboard/student/messages" : "/dashboard/tutor/messages";
  const canSend = canMessagePair(Boolean(selected?.active));
  const canRead = canReadHistory(Boolean(assignment));
  const emptyLabel = role === "STUDENT" ? "No assigned tutors yet." : "No assigned students yet.";

  return (
    <div className="grid min-h-[640px] gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="card flex flex-col overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-navy">Conversations</p>
          <p className="mt-0.5 text-xs text-mute">
            {people.length} contact{people.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {people.map((person) => {
            const active = selected?.id === person.id;
            return (
              <div
                key={person.id}
                className={`mb-1 flex items-stretch gap-1 rounded-xl transition ${
                  active ? "bg-navy text-ivory" : "hover:bg-ivory"
                }`}
              >
                <Link href={`${base}/${person.id}`} className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3">
                  <span className="relative shrink-0">
                    <Portrait name={person.name} src={person.imageUrl} className="h-10 w-10 rounded-full text-sm" />
                    {person.unread ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-gold" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {person.pinned ? (
                          <Pin className="h-3 w-3 shrink-0 fill-current text-gold" aria-hidden />
                        ) : null}
                        <span className={`truncate text-sm font-medium ${active ? "text-ivory" : "text-navy"}`}>
                          {person.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {person.active ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              active ? "bg-gold/25 text-gold" : "bg-navy/10 text-navy"
                            }`}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              active ? "bg-white/10 text-ivory/70" : "bg-mute/15 text-mute"
                            }`}
                          >
                            Ended
                          </span>
                        )}
                        {person.unread ? (
                          <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-deep">
                            {person.unread}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className={`mt-0.5 block truncate text-xs ${active ? "text-ivory/65" : "text-mute"} ${person.unread && !active ? "font-medium text-navy/80" : ""}`}>
                      {person.lastBody}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 pr-2">
                  <form action={toggleConversationPin}>
                    <input type="hidden" name="otherUserId" value={person.id} />
                    <input type="hidden" name="returnTo" value={active ? `${base}/${person.id}` : base} />
                    <button
                      type="submit"
                      title={person.pinned ? "Unpin conversation" : "Pin conversation"}
                      aria-label={person.pinned ? "Unpin conversation" : "Pin conversation"}
                      className={`rounded-lg p-1.5 transition ${
                        active
                          ? person.pinned
                            ? "text-gold hover:bg-white/10"
                            : "text-ivory/55 hover:bg-white/10 hover:text-ivory"
                          : person.pinned
                            ? "text-gold hover:bg-paper"
                            : "text-mute hover:bg-paper hover:text-navy"
                      }`}
                    >
                      <Pin className={`h-3.5 w-3.5 ${person.pinned ? "fill-current" : ""}`} />
                    </button>
                  </form>
                  {person.hasIncoming && !person.unread ? (
                    <form action={markConversationUnread}>
                      <input type="hidden" name="otherUserId" value={person.id} />
                      <input type="hidden" name="returnTo" value={base} />
                      <button
                        type="submit"
                        title="Mark as unread"
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                          active
                            ? "text-ivory/70 hover:bg-white/10 hover:text-ivory"
                            : "text-mute hover:bg-paper hover:text-navy"
                        }`}
                      >
                        Mark unread
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!people.length ? <p className="px-3 py-6 text-sm text-mute">{emptyLabel}</p> : null}
        </div>
      </aside>

      <section className="card flex min-h-[640px] flex-col overflow-hidden">
        {selected && canRead ? (
          <>
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Portrait name={selected.name} src={selected.imageUrl} className="h-11 w-11 rounded-full text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="truncate font-serif text-2xl leading-none text-navy">{selected.name}</h2>
                  {selected.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-mute/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mute">
                      Ended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-mute">
                  {selected.active ? "Active tutoring relationship" : "Assignment ended · history only"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={toggleConversationPin}>
                  <input type="hidden" name="otherUserId" value={selected.id} />
                  <input type="hidden" name="returnTo" value={`${base}/${selected.id}`} />
                  <button
                    type="submit"
                    title={selected.pinned ? "Unpin conversation" : "Pin conversation"}
                    className={`btn btn-line !px-3 !py-1.5 text-xs whitespace-nowrap ${selected.pinned ? "!border-gold/40 !text-gold" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Pin className={`h-3.5 w-3.5 ${selected.pinned ? "fill-current" : ""}`} />
                      {selected.pinned ? "Pinned" : "Pin"}
                    </span>
                  </button>
                </form>
                {selected.hasIncoming ? (
                  <form action={markConversationUnread}>
                    <input type="hidden" name="otherUserId" value={selected.id} />
                    <input type="hidden" name="returnTo" value={base} />
                    <button type="submit" className="btn btn-line !px-3 !py-1.5 text-xs whitespace-nowrap">
                      Mark unread
                    </button>
                  </form>
                ) : null}
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-ivory/50 px-4 py-4">
              {messages.length ? (
                messages.map((message) => {
                  const mine = message.senderId === userId;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                            mine ? "rounded-br-md bg-navy text-ivory" : "rounded-bl-md border border-line bg-paper text-navy"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.body}</p>
                          {message.attachmentUrl ? (
                            <a
                              className={`mt-2 inline-flex text-xs font-medium underline underline-offset-2 ${mine ? "text-gold" : "text-navy"}`}
                              href={message.attachmentUrl}
                            >
                              {message.attachmentName || "Attachment"}
                            </a>
                          ) : null}
                        </div>
                        <p className={`mt-1 px-1 text-[11px] text-mute ${mine ? "text-right" : "text-left"}`}>
                          {formatWhen(message.createdAt, timeZone)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid h-full place-items-center px-4 text-center">
                  <div>
                    <p className="font-serif text-2xl text-navy">Start the conversation</p>
                    <p className="mt-2 text-sm text-mute">
                      {canSend
                        ? `Send ${selected.name.split(" ")[0]} a note about goals, homework, or the next session.`
                        : "Messaging is closed for this assignment."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-line bg-paper p-3">
              {canSend ? (
                <form action={sendMessage} className="flex items-end gap-2 rounded-2xl border border-line bg-ivory p-2">
                  <input type="hidden" name="recipientId" value={selected.id} />
                  <label
                    className="mb-0.5 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-navy/15 bg-paper text-lg font-semibold leading-none text-navy shadow-sm transition hover:border-gold hover:bg-gold/20"
                    title="Attach a file (max 4MB)"
                  >
                    <input className="sr-only" type="file" name="file" />
                    +
                  </label>
                  <textarea
                    className="min-h-[40px] max-h-32 flex-1 resize-none rounded-xl border-0 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-mute"
                    name="body"
                    rows={1}
                    placeholder={`Message ${selected.name.split(" ")[0]}…`}
                    required
                  />
                  <button className="btn btn-primary mb-0.5 !px-4 !py-2 text-sm" type="submit">
                    Send
                  </button>
                </form>
              ) : (
                <p className="rounded-xl bg-ivory px-4 py-3 text-sm text-mute">
                  This assignment has ended. You can still read the history, but new messages are closed.
                </p>
              )}

              <details className="mt-2">
                <summary className="cursor-pointer list-none px-1 py-1 text-xs text-mute hover:text-navy [&::-webkit-details-marker]:hidden">
                  Report a concern
                </summary>
                <div className="mt-2 rounded-xl border border-line bg-ivory px-3 py-3">
                  <ReportForm subjectUserId={selected.id} />
                </div>
              </details>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <p className="font-serif text-3xl text-navy">Your inbox</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-mute">
                {people.length
                  ? "Choose a conversation from the left."
                  : role === "STUDENT"
                    ? "Messages open after we assign you a tutor. Free consultations do not unlock chat."
                    : "Messages appear here once a student is officially assigned to you."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
