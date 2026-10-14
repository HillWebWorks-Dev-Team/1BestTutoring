export const BRAND = {
  name: "1% Better Tutoring",
  short: "1% Better",
  tagline: "Get 1% better, every day.",
  description:
    "A premium tutoring platform connecting students with verified tutors from the Ivy League, Stanford, MIT, and other top-30 universities.",
};

export const SUBJECTS = [
  "Mathematics",
  "Algebra",
  "Geometry",
  "Precalculus",
  "Calculus",
  "Statistics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Data Science",
  "Economics",
  "English",
  "Writing",
  "Literature",
  "History",
  "Government / Politics",
  "Psychology",
  "Spanish",
  "French",
  "Mandarin",
  "Latin",
  "SAT / ACT Prep",
  "AP Exam Prep",
  "GRE / GMAT Prep",
  "College Essays",
  "Study Skills",
] as const;

export const GRADE_LEVELS = ["Elementary", "Middle School", "High School", "College", "Graduate"] as const;

/** Comma/semicolon-separated free-text extras from an “Other” field. */
export function parseOtherList(raw: string | null | undefined, max = 8) {
  return (raw ?? "")
    .split(/[,;]/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter((part) => part.length >= 2 && part.length <= 60)
    .slice(0, max);
}

export function mergeCheckboxList(
  selected: FormDataEntryValue[],
  allowed: readonly string[],
  otherRaw?: string | null,
) {
  const fromBoxes = selected
    .map(String)
    .map((value) => value.trim())
    .filter((value) => allowed.includes(value));
  const custom = parseOtherList(otherRaw);
  return [...new Set([...fromBoxes, ...custom])];
}

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
