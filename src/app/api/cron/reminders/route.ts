import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { formatWhen } from "@/lib/format";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (secret && header !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      startsAt: { gt: new Date(now), lt: new Date(now + 26 * 60 * 60 * 1000) },
    },
    include: { student: { include: { user: true } }, tutor: { include: { user: true } } },
  });

  let sent = 0;
  for (const booking of bookings) {
    const hours = (booking.startsAt.getTime() - now) / 36e5;
    const windows = [
      hours <= 26 && hours >= 20 ? "24h" : null,
      hours <= 2 && hours >= 0.4 ? "1h" : null,
    ].filter((item): item is string => Boolean(item));
    for (const window of windows) {
      const when = formatWhen(booking.startsAt, booking.student.user.timezone);
      const people = [
        { user: booking.student.user, href: "/dashboard/student/calendar" },
        { user: booking.tutor.user, href: "/dashboard/tutor/calendar" },
      ];
      for (const person of people) {
        await notify({
          userId: person.user.id,
          email: person.user.email,
          type: "REMINDER",
          title: window === "1h" ? "Session in about an hour" : "Session tomorrow",
          body: `${booking.type === "CONSULTATION" ? "Consultation" : "Tutoring"} at ${when}.`,
          href: person.href,
          dedupeKey: `reminder-${window}-${booking.id}`,
        });
        sent += 1;
      }
    }
  }
  return Response.json({ sent });
}
