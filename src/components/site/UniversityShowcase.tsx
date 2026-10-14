import { UNIVERSITY_DISCLAIMER, universityFor, type University } from "@/lib/universities";
import { UniversityCarousel } from "@/components/site/UniversityCarousel";

function schoolsWithLogos(names: string[]): University[] {
  const withLogos = [...new Set(names)]
    .map((name) => universityFor(name))
    .filter((school): school is University & { logo: string } => Boolean(school.logo));

  const withoutHarvard = withLogos
    .filter((school) => school.short !== "Harvard")
    .sort((a, b) => a.short.localeCompare(b.short));
  const harvard = withLogos.find((school) => school.short === "Harvard");

  if (!harvard) return withoutHarvard;

  // Place Harvard in the middle so the carousel opens centered on it.
  const mid = Math.floor(withoutHarvard.length / 2);
  return [...withoutHarvard.slice(0, mid), harvard, ...withoutHarvard.slice(mid)];
}

export function UniversityShowcase({ schools }: { schools: string[] }) {
  const ordered = schoolsWithLogos(schools);

  return (
    <section className="border-b border-line bg-ivory py-14" aria-labelledby="universities-heading">
      <div className="shell text-center">
        <p className="kicker">Universities</p>
        <h2 id="universities-heading" className="display mx-auto mt-3 max-w-3xl text-4xl text-navy md:text-5xl">
          Learn from tutors at leading universities.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-mute">
          School names show where our verified tutors studied. Browse tutors from a campus below.
        </p>

        {ordered.length ? (
          <UniversityCarousel schools={ordered} />
        ) : (
          <p className="mt-8 text-sm text-mute">
            University names appear here once a verified tutor from that school is approved.
          </p>
        )}

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-mute">{UNIVERSITY_DISCLAIMER}</p>
      </div>
    </section>
  );
}
