import { UNIVERSITIES, UNIVERSITY_DISCLAIMER, type University } from "@/lib/universities";
import { UniversityCarousel } from "@/components/site/UniversityCarousel";

function brandedSchools(): University[] {
  const withLogos = UNIVERSITIES.filter((school): school is University & { logo: string } => Boolean(school.logo));
  const withoutHarvard = withLogos
    .filter((school) => school.short !== "Harvard")
    .sort((a, b) => a.short.localeCompare(b.short));
  const harvard = withLogos.find((school) => school.short === "Harvard");

  if (!harvard) return withoutHarvard;

  // Place Harvard in the middle so the carousel opens centered on it.
  const mid = Math.floor(withoutHarvard.length / 2);
  return [...withoutHarvard.slice(0, mid), harvard, ...withoutHarvard.slice(mid)];
}

/** Always shows branded school logos - not gated on approved tutor applications. */
export function UniversityShowcase() {
  const ordered = brandedSchools();

  return (
    <section className="border-b border-line bg-ivory py-14" aria-labelledby="universities-heading">
      <div className="shell text-center">
        <p className="kicker">Universities</p>
        <h2 id="universities-heading" className="display mx-auto mt-3 max-w-3xl text-4xl text-navy md:text-5xl">
          Learn from tutors at leading universities.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-mute">
          Browse by campus to find tutors who studied at these schools.
        </p>

        <UniversityCarousel schools={ordered} />

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-mute">{UNIVERSITY_DISCLAIMER}</p>
      </div>
    </section>
  );
}
