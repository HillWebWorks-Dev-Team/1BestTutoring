import { DateTime } from "luxon";

export function calendarIcs(options: {
  uid: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  url?: string | null;
}) {
  const stamp = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const start = DateTime.fromJSDate(options.startsAt).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const end = DateTime.fromJSDate(options.endsAt).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const description = `${options.description}${options.url ? `\\nJoin: ${options.url}` : ""}`.replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//1% Better Tutoring//Sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${options.uid}@onepercentbetter`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${options.title}`,
    `DESCRIPTION:${description}`,
    options.url ? `URL:${options.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
