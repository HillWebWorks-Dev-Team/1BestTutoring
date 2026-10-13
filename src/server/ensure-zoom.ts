"use server";

import { createZoomMeeting } from "@/lib/zoom";
import { live } from "@/lib/live";

export async function ensureBookingZoom(bookingId: string) {
  const db = await live();
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: { include: { user: true } }, student: { include: { user: true } } },
  });
  if (!booking) return null;
  if (booking.zoomJoinUrl) return booking;
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") return booking;

  const label = booking.type === "CONSULTATION" ? "Free consultation" : "Tutoring session";
  const meeting = await createZoomMeeting({
    topic: `${label} · ${booking.tutor.user.name} & ${booking.student.user.name}`,
    startsAt: booking.startsAt,
    durationMin: booking.durationMin,
  });
  if (!meeting.joinUrl) return booking;

  return db.booking.update({
    where: { id: booking.id },
    data: {
      zoomJoinUrl: meeting.joinUrl,
      zoomStartUrl: meeting.startUrl,
      zoomMeetingId: meeting.meetingId,
    },
    include: { tutor: { include: { user: true } }, student: { include: { user: true } } },
  });
}
