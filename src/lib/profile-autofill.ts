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
  return UNIVERSITIES.find((school) => lower.includes(school.name.toLowerCase()) || lower.includes(school.short.toLowerCase()));
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

function findName(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (EMAIL_RE.test(line) || /linkedin|http|@|resume|curriculum/i.test(line)) continue;
    if (NAME_LINE_RE.test(line) && line.length < 48) return line;
  }
  return undefined;
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
  const degreeRaw = text.match(DEGREE_RE)?.[1];
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
