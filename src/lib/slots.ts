import { DateTime } from "luxon";

export type AvailabilityWindow = {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
};

export type BusyInterval = {
  startsAt: Date;
  endsAt: Date;
};

export function jsWeekday(date: string, timeZone: string) {
  const day = DateTime.fromISO(date, { zone: timeZone });
  if (!day.isValid) return null;
  return day.weekday % 7;
}

export function buildSlots(options: {
  date: string;
  timeZone: string;
  rules: AvailabilityWindow[];
  durationMin: number;
  blocks?: string[];
  busy?: BusyInterval[];
  now?: Date;
  leadMinutes?: number;
}) {
  const { date, timeZone, rules, durationMin } = options;
  const blocks = options.blocks ?? [];
  const busy = options.busy ?? [];
  const now = options.now ?? new Date();
  const leadMinutes = options.leadMinutes ?? 120;

  if (blocks.includes(date)) return [];
  const weekday = jsWeekday(date, timeZone);
  if (weekday === null) return [];

  const earliest = DateTime.fromJSDate(now).plus({ minutes: leadMinutes });
  const slots: Date[] = [];

  for (const rule of rules) {
    if (rule.dayOfWeek !== weekday) continue;
    if (rule.endMin <= rule.startMin || durationMin <= 0) continue;

    let cursor = DateTime.fromISO(date, { zone: timeZone }).startOf("day").plus({ minutes: rule.startMin });
    const windowEnd = DateTime.fromISO(date, { zone: timeZone }).startOf("day").plus({ minutes: rule.endMin });

    while (cursor.plus({ minutes: durationMin }) <= windowEnd) {
      const end = cursor.plus({ minutes: durationMin });
      const startsAt = cursor.toUTC().toJSDate();
      const endsAt = end.toUTC().toJSDate();
      const overlaps = busy.some((item) => item.startsAt < endsAt && item.endsAt > startsAt);
      if (!overlaps && cursor.toUTC() >= earliest.toUTC()) {
        slots.push(startsAt);
      }
      cursor = cursor.plus({ minutes: durationMin });
    }
  }

  slots.sort((a, b) => a.getTime() - b.getTime());
  return slots;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}
