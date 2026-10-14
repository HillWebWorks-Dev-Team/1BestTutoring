import { money } from "@/lib/format";
import { areaPath, type MonthPoint, type SeriesPoint, type WeekPoint } from "@/lib/analytics";

export function RevenueAreaChart({
  points,
  title = "Revenue",
  subtitle,
}: {
  points: Array<MonthPoint | WeekPoint>;
  title?: string;
  subtitle?: string;
}) {
  const values = points.map((point) => point.value);
  const total = values.reduce((sum, value) => sum + value, 0);
  const width = 640;
  const height = 220;
  const { line, area, points: coords, max } = areaPath(values, width, height, 16);
  const peak = Math.max(...values, 0);

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-line bg-paper p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,_rgb(213_163_68_/_0.14),_transparent_65%)]"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">{title}</p>
          <p className="mt-2 font-serif text-4xl text-navy sm:text-5xl">{money(total)}</p>
          {subtitle ? <p className="mt-1 text-sm text-mute">{subtitle}</p> : null}
        </div>
        <div className="rounded-full border border-gold/35 bg-cream/70 px-3 py-1.5 text-xs font-semibold text-navy">
          Peak {money(peak)}
        </div>
      </div>

      <div className="relative mt-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label={`${title} chart`}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b2038" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0b2038" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0b2038" />
              <stop offset="100%" stopColor="#d5a344" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = 16 + (1 - fraction) * (height - 32);
            return (
              <line
                key={fraction}
                x1="16"
                x2={width - 16}
                y1={y}
                y2={y}
                stroke="#e5e8ec"
                strokeDasharray="4 6"
              />
            );
          })}
          {area ? <path d={area} fill="url(#revenueFill)" /> : null}
          {line ? <path d={line} fill="none" stroke="url(#revenueStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {coords?.map((point, i) =>
            values[i] > 0 ? (
              <circle key={points[i].key} cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#d5a344" strokeWidth="2">
                <title>
                  {points[i].label}: {money(values[i])}
                </title>
              </circle>
            ) : null,
          )}
        </svg>
        <div className="mt-1 flex justify-between gap-1 px-1">
          {points.map((point) => (
            <span key={point.key} className="min-w-0 flex-1 truncate text-center text-[10px] uppercase tracking-[0.12em] text-mute">
              {point.label}
            </span>
          ))}
        </div>
        {!total ? (
          <p className="absolute inset-0 grid place-items-center text-sm text-mute">No revenue in this window yet.</p>
        ) : null}
      </div>
      <p className="sr-only">Max month value {money(max || 0)}</p>
    </article>
  );
}

export function SessionMixChart({ points }: { points: SeriesPoint[] }) {
  const max = Math.max(...points.flatMap((point) => [point.consults, point.sessions]), 1);
  const consultTotal = points.reduce((sum, point) => sum + point.consults, 0);
  const sessionTotal = points.reduce((sum, point) => sum + point.sessions, 0);

  return (
    <article className="rounded-[1.75rem] border border-line bg-paper p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Activity</p>
          <h2 className="mt-2 font-serif text-3xl text-navy">Consults & sessions</h2>
          <p className="mt-1 text-sm text-mute">Completed or confirmed volume by month</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <LegendDot color="bg-navy" label={`${consultTotal} consults`} />
          <LegendDot color="bg-gold" label={`${sessionTotal} sessions`} />
        </div>
      </div>

      <div className="mt-8 flex h-52 items-end gap-2 sm:gap-3">
        {points.map((point) => (
          <div key={point.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <Bar value={point.consults} max={max} tone="navy" title={`${point.label}: ${point.consults} consults`} />
              <Bar value={point.sessions} max={max} tone="gold" title={`${point.label}: ${point.sessions} sessions`} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] text-mute">{point.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function RetentionRing({
  rate,
  returning,
  active,
  conversionRate,
  converted,
  consultTotal,
}: {
  rate: number;
  returning: number;
  active: number;
  conversionRate: number;
  converted: number;
  consultTotal: number;
}) {
  const size = 160;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <article className="rounded-[1.75rem] border border-line bg-paper p-5 shadow-[var(--shadow-card)] sm:p-6">
      <p className="kicker">Retention</p>
      <h2 className="mt-2 font-serif text-3xl text-navy">Who comes back</h2>
      <p className="mt-1 text-sm text-mute">Share of paying students with two or more completed sessions</p>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Retention ${rate}%`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e8ec" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#d5a344"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-serif text-4xl text-navy">{rate}%</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-mute">Return</p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <MetricRow label="Returning students" value={String(returning)} detail={`of ${active} with a paid session`} />
          <MetricRow
            label="Consult → match"
            value={consultTotal ? `${conversionRate}%` : "—"}
            detail={consultTotal ? `${converted} of ${consultTotal} consult pairs assigned` : "No consults yet"}
          />
        </div>
      </div>
    </article>
  );
}

export function InsightStrip({
  items,
}: {
  items: Array<{ label: string; value: string; detail: string }>;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-[1.5rem] border border-line bg-gradient-to-br from-paper to-ivory p-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{item.label}</p>
          <p className="mt-2 font-serif text-3xl text-navy">{item.value}</p>
          <p className="mt-1 text-xs leading-5 text-mute">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}

function Bar({
  value,
  max,
  tone,
  title,
}: {
  value: number;
  max: number;
  tone: "navy" | "gold";
  title: string;
}) {
  const height = Math.max(value > 0 ? 10 : 3, (value / max) * 100);
  return (
    <div
      className={`w-[42%] max-w-5 rounded-t-lg transition-all ${tone === "navy" ? "bg-navy" : "bg-gold"}`}
      style={{ height: `${height}%` }}
      title={title}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-mute">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function MetricRow({ label, value, detail }: { label: string; detail: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ivory/80 px-3 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">{label}</p>
        <p className="font-serif text-2xl text-navy">{value}</p>
      </div>
      <p className="mt-1 text-xs text-mute">{detail}</p>
    </div>
  );
}
