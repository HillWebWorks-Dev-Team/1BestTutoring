import { prisma } from "@/lib/db";
import { calendarIcs } from "@/lib/ics";
import { getSession } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return new Response("Sign in required", { status: 401 });
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { student: { include: { user: true, parent: true } }, tutor: { include: { user: true } } },
  });
  if (!booking) return new Response("Not found", { status: 404 });
  const allowed = [booking.student.userId, booking.tutor.userId, booking.student.parent?.userId].includes(session.uid) || session.role === "ADMIN";
  if (!allowed) return new Response("Not found", { status: 404 });
  const title = `${booking.type === "CONSULTATION" ? "Consultation" : "Tutoring"} · ${booking.tutor.user.name} & ${booking.student.user.name}`;
  const ics = calendarIcs({
    uid: booking.id,
    title,
    description: "1% Better Tutoring",
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    url: booking.zoomJoinUrl,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="one-percent-better-${booking.id}.ics"`,
    },
  });
}
