import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import { UNIVERSITIES } from "@/lib/universities";

export type ProfileAutofill = {
  name?: string;
  email?: string;
  university?: string;
  major?: string;
  degree?: string;
  graduationYear?: number;
  bio?: string;
  experience?: string;
  education?: string;
  achievements?: string;
  certifications?: string;
  testScores?: string;
  subjects?: string[];
  gradeLevels?: string[];
  linkedinUrl?: string;
};

const DEGREE_RE = /\b(A\.?B\.?|B\.?A\.?|B\.?S\.?|B\.?S\.?E\.?|M\.?A\.?|M\.?S\.?|M\.?Eng\.?|Ph\.?D\.?|J\.?D\.?|M\.?D\.?|MBA)\b/i;
const YEAR_RE = /\b(19|20)\d{2}\b/g;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%/]+/i;
const NAME_LINE_RE = /^([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){1,3})$/;
const ROLE_LINE_RE =
  /\b(designer|developer|engineer|tutor|teacher|student|graduate|scientist|analyst|specialist|consultant|founder|intern)\b|\|/i;

function clean(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sectionAfter(text: string, labels: string[]) {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:Experience|Education|Skills|Projects|Certifications|Achievements|Awards|Summary|About|Contact|References)\\b|$)`,
    "i",
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() || "";
}

function findUniversity(text: string) {
  const lower = text.toLowerCase();
  return UNIVERSITIES.find((school) => {
    if (lower.includes(school.name.toLowerCase())) return true;
    // Word-boundary match for shorts - avoids "MIT" matching inside "permit".
    const short = school.short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-z0-9])${short}(?:[^a-z0-9]|$)`, "i").test(text);
  });
}

function findSubjects(text: string) {
  const lower = text.toLowerCase();
  return SUBJECTS.filter((subject) => lower.includes(subject.toLowerCase()));
}

function findGrades(text: string) {
  const lower = text.toLowerCase();
  return GRADE_LEVELS.filter((level) => lower.includes(level.toLowerCase()));
}

function findMajor(text: string, universityName?: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (universityName && line.toLowerCase().includes(universityName.toLowerCase())) {
      const majorMatch =
        line.match(/\bin\s+([A-Za-z][A-Za-z &/-]{2,40})/i) ||
        line.match(/\b([A-Za-z][A-Za-z &/-]{2,40})\s+(?:major|concentration)/i);
      if (majorMatch?.[1]) return majorMatch[1].replace(/[,.]$/, "").trim();
    }
  }
  const standalone = text.match(/\bMajor\s*[:\-]\s*([A-Za-z][A-Za-z &/-]{2,40})/i);
  return standalone?.[1]?.replace(/[,.]$/, "").trim();
}

const NAME_STOP = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function toTitleCaseName(value: string) {
  return value
    .trim()
    .replace(/[.:]+$/g, "")
    .split(/\s+/)
    .map((part) =>
      part
        .split("-")
        .map((chunk) => (chunk ? chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase() : chunk))
        .join("-"),
    )
    .join(" ");
}

function isNameWords(line: string) {
  const normalized = line.trim().replace(/[.:]+$/g, "");
  const words = normalized.split(/\s+/);
  if (words.length < 2 || words.length > 4 || normalized.length >= 48 || /\d/.test(normalized)) return false;
  if (EMAIL_RE.test(normalized) || /linkedin|http|@|resume|curriculum|\||,/i.test(normalized)) return false;
  if (words.some((word) => NAME_STOP.has(word.toLowerCase()))) return false;
  if (!words.every((word) => /^[A-Za-z][A-Za-z.'-]*$/.test(word))) return false;

  const letters = normalized.replace(/[^A-Za-z]/g, "");
  const upper = (normalized.match(/[A-Z]/g) || []).length;
  const mostlyUpper = letters.length > 0 && upper / letters.length >= 0.7;
  const titleCase = words.every((word) => /^[A-Z][a-z.'-]+$/.test(word));
  return mostlyUpper || titleCase;
}

function findName(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  // Classic title-case name near the top of a plain resume
  for (const line of lines.slice(0, 12)) {
    if (EMAIL_RE.test(line) || /linkedin|http|@|resume|curriculum/i.test(line)) continue;
    if (NAME_LINE_RE.test(line) && line.length < 48) return line;
  }

  // Designed PDFs often use ALL CAPS and/or split "FIRST" / "MIDDLE LAST" across lines
  let fallback: string | undefined;
  for (let i = 0; i < Math.min(lines.length, 80); i++) {
    const options = [lines[i]];
    if (lines[i + 1]) options.push(`${lines[i]} ${lines[i + 1]}`);

    for (const candidate of options) {
      const normalized = candidate.replace(/\s+/g, " ").trim();
      if (!isNameWords(normalized)) continue;
      const titled = toTitleCaseName(normalized);
      const afterIndex = candidate === lines[i] ? i + 1 : i + 2;
      const after = lines[afterIndex] || "";
      if (ROLE_LINE_RE.test(after)) return titled;
      if (!fallback) fallback = titled;
    }
  }
  return fallback;
}

function pickGraduationYear(text: string) {
  const years = [...text.matchAll(YEAR_RE)].map((match) => Number(match[0]));
  const plausible = years.filter((year) => year >= 1970 && year <= 2045);
  if (!plausible.length) return undefined;
  return Math.max(...plausible);
}

export function parseProfileText(raw: string): ProfileAutofill {
  const text = clean(raw);
  if (!text) return {};

  const university = findUniversity(text);
  // Skip office-suite false positives like "MS Excel".
  const degreeRaw = text
    .replace(/\bMS\s+(Excel|Word|PowerPoint|Office|Teams)\b/gi, " ")
    .match(DEGREE_RE)?.[1];
  const degreeKey = degreeRaw?.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
  const degreeMap: Record<string, string> = {
    AB: "A.B.",
    BA: "B.A.",
    BS: "B.S.",
    BSE: "B.S.E.",
    MA: "M.A.",
    MS: "M.S.",
    MENG: "M.Eng.",
    PHD: "Ph.D.",
    JD: "J.D.",
    MD: "M.D.",
    MBA: "MBA",
  };
  const normalizedDegree = degreeKey ? degreeMap[degreeKey] || degreeRaw : undefined;

  const about =
    sectionAfter(text, ["About", "Summary", "Profile", "Objective", "Professional Summary"]) ||
    text.split("\n").slice(0, 12).join(" ").slice(0, 600);
  const experience =
    sectionAfter(text, ["Experience", "Work Experience", "Tutoring Experience", "Teaching Experience", "Employment"]) ||
    undefined;
  const education = sectionAfter(text, ["Education", "Academic Background"]) || undefined;
  const achievements = sectionAfter(text, ["Achievements", "Awards", "Honors", "Accomplishments"]) || undefined;
  const certifications = sectionAfter(text, ["Certifications", "Certificates", "Licenses"]) || undefined;
  const scores =
    text.match(/\b(?:SAT|ACT|GRE|GMAT)\s*[:\-]?\s*[\d]{2,4}(?:\s*\/\s*[\d]{2,4})?/i)?.[0] ||
    sectionAfter(text, ["Test Scores", "Scores"]);

  const subjects = findSubjects(text);
  const gradeLevels = findGrades(text);
  const email = text.match(EMAIL_RE)?.[0];
  const linkedinUrl = text.match(LINKEDIN_RE)?.[0]?.replace(/\/$/, "");
  const major = findMajor(text, university?.name) || findMajor(education || "");

  const draft: ProfileAutofill = {
    name: findName(text),
    email: email?.toLowerCase(),
    university: university?.name,
    major,
    degree: normalizedDegree,
    graduationYear: pickGraduationYear(`${education || ""}\n${text.slice(0, 1200)}`),
    bio: about.length >= 20 ? about.slice(0, 1200) : undefined,
    experience: experience?.slice(0, 2000),
    education: education?.slice(0, 1200),
    achievements: achievements?.slice(0, 1200),
    certifications: certifications?.slice(0, 800),
    testScores: scores?.slice(0, 200),
    subjects: subjects.length ? [...subjects] : undefined,
    gradeLevels: gradeLevels.length ? [...gradeLevels] : undefined,
    linkedinUrl,
  };

  return Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== undefined && value !== "")) as ProfileAutofill;
}

export function isLinkedInUrl(value: string) {
  return LINKEDIN_RE.test(value.trim());
}

export function normalizeLinkedInUrl(value: string) {
  const match = value.trim().match(LINKEDIN_RE);
  return match?.[0]?.replace(/\/$/, "") || "";
}
