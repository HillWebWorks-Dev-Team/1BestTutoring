import { initials } from "@/lib/format";
import { universityFor } from "@/lib/universities";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-lg object-cover"
      />
      <span>
        <span className={`block font-serif text-[1.15rem] leading-none tracking-tight ${light ? "text-ivory" : "text-navy"}`}>
          1% Better
        </span>
        <span className={`mt-1 block text-[10px] uppercase tracking-[0.2em] ${light ? "text-ivory/70" : "text-slate"}`}>
          Tutoring
        </span>
      </span>
    </span>
  );
}

const PALETTES = [
  ["#142A43", "#D9A441"],
  ["#0B1D33", "#EAC477"],
  ["#1c334f", "#F7F4ED"],
  ["#142A43", "#64748B"],
  ["#243044", "#E8E2D8"],
];

export function Portrait({
  name,
  src,
  className = "h-16 w-16 rounded-2xl",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return <img src={src} alt="" className={`${className} object-cover`} />;
  }
  const index = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % PALETTES.length;
  const [from, to] = PALETTES[index];
  return (
    <div
      className={`${className} grid place-items-center font-serif text-lg text-ivory`}
      style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
    >
      {initials(name)}
    </div>
  );
}

export function UniversityMark({
  university,
  compact = false,
  light = false,
}: {
  university: string;
  compact?: boolean;
  light?: boolean;
}) {
  const school = universityFor(university);
  return (
    <span className="inline-flex items-center gap-2.5">
      {school.logo ? (
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-white">
          <img src={school.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" decoding="async" />
        </span>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/45 bg-navy font-serif text-[10px] tracking-wide text-gold">
          {school.mark}
        </span>
      )}
      {compact ? null : (
        <span className="min-w-0">
          <span className={`block truncate text-sm font-medium leading-tight ${light ? "text-ivory" : "text-navy"}`}>
            {school.short}
          </span>
          <span className={`block text-[10px] uppercase tracking-[0.16em] ${light ? "text-ivory/60" : "text-slate"}`}>
            {school.group}
          </span>
        </span>
      )}
    </span>
  );
}
