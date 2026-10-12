export type University = {
  name: string;
  short: string;
  mark: string;
  group: "Ivy League" | "Top 30";
};

export const UNIVERSITIES: University[] = [
  { name: "Harvard University", short: "Harvard", mark: "H", group: "Ivy League" },
  { name: "Yale University", short: "Yale", mark: "Y", group: "Ivy League" },
  { name: "Princeton University", short: "Princeton", mark: "P", group: "Ivy League" },
  { name: "Columbia University", short: "Columbia", mark: "C", group: "Ivy League" },
  { name: "University of Pennsylvania", short: "Penn", mark: "P", group: "Ivy League" },
  { name: "Brown University", short: "Brown", mark: "B", group: "Ivy League" },
  { name: "Dartmouth College", short: "Dartmouth", mark: "D", group: "Ivy League" },
  { name: "Cornell University", short: "Cornell", mark: "C", group: "Ivy League" },
  { name: "Stanford University", short: "Stanford", mark: "S", group: "Top 30" },
  { name: "Massachusetts Institute of Technology", short: "MIT", mark: "MIT", group: "Top 30" },
  { name: "Duke University", short: "Duke", mark: "D", group: "Top 30" },
  { name: "University of Chicago", short: "UChicago", mark: "UC", group: "Top 30" },
  { name: "Northwestern University", short: "Northwestern", mark: "N", group: "Top 30" },
];

const SKIP = new Set(["of", "the", "and", "at", "for"]);

export function universityFor(value: string): University {
  const found = UNIVERSITIES.find(
    (school) => school.name.toLowerCase() === value.toLowerCase() || school.short.toLowerCase() === value.toLowerCase(),
  );
  if (found) return found;
  const words = value.split(/\s+/).filter((word) => !SKIP.has(word.toLowerCase()));
  const mark = words
    .slice(0, 3)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
  return {
    name: value,
    short: value,
    mark: mark.slice(0, 3) || "U",
    group: "Top 30",
  };
}

export const UNIVERSITY_DISCLAIMER =
  "University names show where our verified tutors studied. 1% Better Tutoring is an independent company and is not affiliated with, endorsed by, or sponsored by these institutions.";
