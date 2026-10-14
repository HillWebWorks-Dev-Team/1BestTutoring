const THIS_YEAR = new Date().getFullYear();

export const MAJORS = [
  "Mathematics",
  "Applied Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Economics",
  "English",
  "History",
  "Political Science",
  "Psychology",
  "Philosophy",
  "Neuroscience",
  "Finance",
  "Business",
  "Education",
  "Other",
] as const;

export const DEGREES = [
  "BA",
  "BS",
  "AB",
  "BEng",
  "BFA",
  "MA",
  "MS",
  "MBA",
  "MEd",
  "PhD",
  "JD",
  "MD",
  "Currently enrolled (undergraduate)",
  "Currently enrolled (graduate)",
  "Other",
] as const;

export const GRADUATION_YEAR_OPTIONS = [
  ...Array.from({ length: THIS_YEAR + 6 - 1995 + 1 }, (_, i) => String(THIS_YEAR + 6 - i)),
  "Other",
] as const;

/** Common tutor rates in USD. Server still validates against platform min/max. */
export const HOURLY_RATE_OPTIONS = [
  ...(["40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100", "110", "120", "130", "140", "150", "175", "200"] as const),
  "Other",
] as const;

export const EXPERIENCE_OPTIONS = [
  "Less than 1 year of tutoring",
  "1–2 years of tutoring",
  "3–5 years of tutoring",
  "5+ years of tutoring",
  "Teaching assistant / classroom teaching",
  "Peer tutoring and mentoring",
  "Professional tutoring (agency or private)",
  "Other",
] as const;

export const EDUCATION_OPTIONS = [
  "Currently enrolled undergraduate",
  "Bachelor’s degree completed",
  "Currently enrolled graduate / professional school",
  "Master’s degree completed",
  "Doctoral / professional degree completed",
  "Postdoctoral work",
  "Other",
] as const;

export const ACHIEVEMENT_OPTIONS = [
  "Dean’s list / academic honors",
  "Departmental prize or fellowship",
  "Research publication or thesis award",
  "Competition award (math, debate, olympiad, etc.)",
  "Leadership role in academic organization",
  "None of these / prefer to describe",
  "Other",
] as const;

export const CERTIFICATION_OPTIONS = [
  "None yet",
  "Teaching certificate / credential",
  "TESOL / ESL certification",
  "Subject-specific tutoring certification",
  "CPR / youth safety certification",
  "Other",
] as const;

export const TEST_SCORE_OPTIONS = [
  "Prefer not to share",
  "SAT 1400–1490",
  "SAT 1500–1600",
  "ACT 30–33",
  "ACT 34–36",
  "GRE / GMAT competitive score",
  "AP / IB high scores in teaching subjects",
  "Other",
] as const;

export function resolveSelectOther(selectValue: string, otherValue: string) {
  const selected = selectValue.trim();
  const other = otherValue.trim();
  if (selected === "Other" || selected === "None of these / prefer to describe") {
    return other;
  }
  return selected;
}
