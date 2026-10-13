import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const bookingId = process.argv[2];
if (!bookingId) {
  console.error("Usage: node scripts/backfill-zoom.mjs <bookingId>");
  process.exit(1);
}

const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
const tokenRes = await fetch(
  `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(process.env.ZOOM_ACCOUNT_ID)}`,
  { method: "POST", headers: { Authorization: `Basic ${credentials}` } },
);
const tokenJson = await tokenRes.json();
if (!tokenJson.access_token) {
  console.error(tokenJson);
  process.exit(1);
}

const prisma = new PrismaClient();
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: { tutor: { include: { user: true } }, student: { include: { user: true } } },
});
if (!booking) {
  console.error("Booking not found");
  process.exit(1);
}

const meetingRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${tokenJson.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    topic: `${booking.type === "CONSULTATION" ? "Free consultation" : "Tutoring session"} · ${booking.tutor.user.name}`,
    type: 2,
    start_time: booking.startsAt.toISOString(),
    duration: booking.durationMin,
    timezone: "UTC",
  }),
});
const meeting = await meetingRes.json();
if (!meeting.join_url) {
  console.error(meeting);
  process.exit(1);
}

await prisma.booking.update({
  where: { id: booking.id },
  data: {
    zoomJoinUrl: meeting.join_url,
    zoomStartUrl: meeting.start_url,
    zoomMeetingId: String(meeting.id),
  },
});

console.log("Updated", booking.id, meeting.join_url);
await prisma.$disconnect();
