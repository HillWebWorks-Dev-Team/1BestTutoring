const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(cents: number) {
  return usd.format((cents || 0) / 100);
}

export function hourly(cents: number) {
  return `${money(cents)}/hr`;
}

export function formatWhen(date: Date, timeZone = "America/New_York", withTime = true) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatTime(date: Date, timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDay(date: Date, timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function ratingOf(ratings: number[]) {
  if (!ratings.length) return null;
  const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return Math.round(avg * 10) / 10;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function referralCode(name: string) {
  const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 6).toUpperCase() || "BETTER";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}
