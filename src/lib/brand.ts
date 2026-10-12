export const BRAND = {
  name: "1% Better Tutoring",
  short: "1% Better",
  tagline: "Get 1% better, every day.",
  description:
    "A premium tutoring platform connecting students with verified tutors from the Ivy League, Stanford, MIT, and other top-30 universities.",
};

export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "English",
  "History",
  "SAT / ACT Prep",
  "College Essays",
] as const;

export const GRADE_LEVELS = ["Middle School", "High School", "College", "Graduate"] as const;

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
  "Europe/London",
  "Asia/Shanghai",
  "Asia/Kolkata",
] as const;

export function splitList(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(", ");
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function paymentsMode(): "demo" | "stripe" {
  const key = process.env.STRIPE_SECRET_KEY;
  if (process.env.PAYMENTS_MODE === "demo") return "demo";
  if (key) return "stripe";
  return "demo";
}
