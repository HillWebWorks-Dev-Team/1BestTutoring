/** Pure helpers for admin analytics charts. */

export type MonthPoint = { key: string; label: string; value: number };
export type WeekPoint = { key: string; label: string; value: number };
export type SeriesPoint = { key: string; label: string; consults: number; sessions: number };

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" });
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function weekKey(date: Date) {
  const start = startOfWeek(date);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

function weekLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleString("en-US", { month: "short", day: "numeric" });
}

export function lastNMonths(now: Date, n: number): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(date);
    points.push({ key, label: monthLabel(key), value: 0 });
  }
  return points;
}

export function lastNWeeks(now: Date, n: number): WeekPoint[] {
  const points: WeekPoint[] = [];
  const thisWeek = startOfWeek(now);
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date(thisWeek);
    date.setDate(thisWeek.getDate() - i * 7);
    const key = weekKey(date);
    points.push({ key, label: weekLabel(key), value: 0 });
  }
  return points;
}

export function bucketRevenueByMonth(
  items: Array<{ createdAt: Date; amountCents: number }>,
  now = new Date(),
  months = 6,
): MonthPoint[] {
  const points = lastNMonths(now, months);
  const index = new Map(points.map((point, i) => [point.key, i]));
  for (const item of items) {
    const key = monthKey(item.createdAt);
    const i = index.get(key);
    if (i == null) continue;
    points[i].value += item.amountCents;
  }
  return points;
}

export function bucketRevenueByWeek(
  items: Array<{ createdAt: Date; amountCents: number }>,
  now = new Date(),
  weeks = 12,
): WeekPoint[] {
  const points = lastNWeeks(now, weeks);
  const index = new Map(points.map((point, i) => [point.key, i]));
  for (const item of items) {
    const key = weekKey(item.createdAt);
    const i = index.get(key);
    if (i == null) continue;
    points[i].value += item.amountCents;
  }
  return points;
}

export function bucketBookingsByMonth(
  items: Array<{ startsAt: Date; type: string }>,
  now = new Date(),
  months = 6,
): SeriesPoint[] {
  const base = lastNMonths(now, months);
  const points: SeriesPoint[] = base.map((point) => ({
    key: point.key,
    label: point.label,
    consults: 0,
    sessions: 0,
  }));
  const index = new Map(points.map((point, i) => [point.key, i]));
  for (const item of items) {
    const key = monthKey(item.startsAt);
    const i = index.get(key);
    if (i == null) continue;
    if (item.type === "CONSULTATION") points[i].consults += 1;
    if (item.type === "SESSION") points[i].sessions += 1;
  }
  return points;
}

/** Students with ≥2 completed paid sessions / students with ≥1. */
export function retentionRate(completedSessionsByStudent: number[]) {
  const active = completedSessionsByStudent.filter((count) => count >= 1);
  if (!active.length) return { rate: 0, returning: 0, active: 0 };
  const returning = active.filter((count) => count >= 2).length;
  return {
    rate: Math.round((returning / active.length) * 100),
    returning,
    active: active.length,
  };
}

export function consultConversion(options: {
  consultPairs: Array<{ studentId: string; tutorId: string }>;
  assignmentPairs: Array<{ studentId: string; tutorId: string }>;
}) {
  const assigned = new Set(options.assignmentPairs.map((item) => `${item.studentId}:${item.tutorId}`));
  const converted = options.consultPairs.filter((item) => assigned.has(`${item.studentId}:${item.tutorId}`)).length;
  const total = options.consultPairs.length;
  return {
    rate: total ? Math.round((converted / total) * 100) : 0,
    converted,
    total,
  };
}

export function areaPath(values: number[], width: number, height: number, pad = 8) {
  const max = Math.max(...values, 1);
  if (!values.length) return { line: "", area: "" };
  const step = values.length === 1 ? 0 : (width - pad * 2) / (values.length - 1);
  const points = values.map((value, i) => {
    const x = pad + i * step;
    const y = height - pad - (value / max) * (height - pad * 2);
    return { x, y };
  });
  const line = points.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${(height - pad).toFixed(1)} L${points[0].x.toFixed(1)},${(height - pad).toFixed(1)} Z`;
  return { line, area, points, max };
}
