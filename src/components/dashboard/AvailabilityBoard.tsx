"use client";

import { useMemo, useState } from "react";
import { CalendarOff, Clock3, Plus, Trash2 } from "lucide-react";
import { blockDate, removeBlock, saveAvailability } from "@/server/tutor";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

type WindowState = { start: string; end: string };
type DayState = { enabled: boolean; a: WindowState; b: WindowState; showB: boolean };

type Block = { id: string; date: string; reason: string };

function emptyWindow(): WindowState {
  return { start: "", end: "" };
}

function buildInitial(rules: Array<{ dayOfWeek: number; startMin: number; endMin: number }>): DayState[] {
  return DAYS.map((_, index) => {
    const windows = rules.filter((rule) => rule.dayOfWeek === index);
    const a = {
      start: windows[0] ? toTime(windows[0].startMin) : "",
      end: windows[0] ? toTime(windows[0].endMin) : "",
    };
    const b = {
      start: windows[1] ? toTime(windows[1].startMin) : "",
      end: windows[1] ? toTime(windows[1].endMin) : "",
    };
    return {
      enabled: Boolean(windows[0]),
      a,
      b,
      showB: Boolean(windows[1]),
    };
  });
}

function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function labelTime(value: string) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatBlockDate(date: string) {
  const [y, mo, d] = date.split("-").map(Number);
  if (!y || !mo || !d) return date;
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AvailabilityBoard({
  timezone,
  initialRules,
  blocks,
}: {
  timezone: string;
  initialRules: Array<{ dayOfWeek: number; startMin: number; endMin: number }>;
  blocks: Block[];
}) {
  const times = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const minutes = 7 * 60 + index * 30;
        return toTime(minutes);
      }),
    [],
  );
  const [days, setDays] = useState(() => buildInitial(initialRules));
  const activeCount = days.filter((day) => day.enabled && day.a.start && day.a.end).length;

  function updateDay(index: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  function updateWindow(index: number, slot: "a" | "b", patch: Partial<WindowState>) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== index) return day;
        return { ...day, [slot]: { ...day[slot], ...patch } };
      }),
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <section className="overflow-hidden rounded-3xl border border-line bg-paper shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Weekly hours</p>
            <p className="mt-1 text-sm text-mute">
              {activeCount ? `${activeCount} day${activeCount === 1 ? "" : "s"} open` : "No days open yet"} · {timezone.replaceAll("_", " ")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1 text-xs font-medium text-navy">
            <Clock3 className="h-3.5 w-3.5 text-gold" aria-hidden />
            30-min steps
          </span>
        </div>

        <form action={saveAvailability} className="flex flex-col">
          <div className="divide-y divide-line">
            {DAYS.map((day, index) => {
              const state = days[index];
              return (
                <div
                  key={day}
                  className={`grid gap-3 px-5 py-4 transition ${state.enabled ? "bg-paper" : "bg-ivory/40"} md:grid-cols-[148px_1fr] md:items-start`}
                >
                  <label className="flex cursor-pointer items-center gap-3 pt-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line accent-navy"
                      checked={state.enabled}
                      onChange={(event) => {
                        const enabled = event.target.checked;
                        updateDay(index, {
                          enabled,
                          a: enabled ? (state.a.start ? state.a : { start: "16:00", end: "20:00" }) : emptyWindow(),
                          b: enabled ? state.b : emptyWindow(),
                          showB: enabled ? state.showB : false,
                        });
                      }}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-navy">{day}</span>
                      <span className={`mt-0.5 block text-xs ${state.enabled ? "text-navy/70" : "text-mute"}`}>
                        {state.enabled ? "Available" : "Off"}
                      </span>
                    </span>
                  </label>

                  {state.enabled ? (
                    <div className="space-y-2.5">
                      <WindowRow
                        name={`${index}-a`}
                        times={times}
                        value={state.a}
                        onChange={(patch) => updateWindow(index, "a", patch)}
                      />
                      {state.showB ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <WindowRow
                            name={`${index}-b`}
                            times={times}
                            value={state.b}
                            onChange={(patch) => updateWindow(index, "b", patch)}
                          />
                          <button
                            type="button"
                            className="rounded-lg px-2 py-1.5 text-xs font-medium text-mute transition hover:bg-ivory hover:text-navy"
                            onClick={() => updateDay(index, { showB: false, b: emptyWindow() })}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input type="hidden" name={`${index}-b-start`} value="" />
                          <input type="hidden" name={`${index}-b-end`} value="" />
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-navy/70 transition hover:text-navy"
                            onClick={() =>
                              updateDay(index, {
                                showB: true,
                                b: { start: state.a.end || "18:00", end: "21:00" },
                              })
                            }
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            Add another window
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-1 md:pt-2">
                      <p className="text-sm text-mute">Not taking bookings this day.</p>
                      <input type="hidden" name={`${index}-a-start`} value="" />
                      <input type="hidden" name={`${index}-a-end`} value="" />
                      <input type="hidden" name={`${index}-b-start`} value="" />
                      <input type="hidden" name={`${index}-b-end`} value="" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ivory/60 px-5 py-4">
            <p className="text-xs text-mute">Consultations are 15 minutes; tutoring uses the platform session length.</p>
            <button className="btn btn-primary" type="submit">
              Save weekly hours
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <section className="overflow-hidden rounded-3xl border border-line bg-paper shadow-[var(--shadow-card)]">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Time off</p>
            <p className="mt-1 text-sm text-mute">Block a full day when you cannot meet.</p>
          </div>

          <form action={blockDate} className="space-y-3 px-5 py-4">
            <div>
              <label className="label" htmlFor="block-date">
                Date
              </label>
              <input id="block-date" className="field" type="date" name="date" required />
            </div>
            <div>
              <label className="label" htmlFor="block-reason">
                Reason <span className="font-normal text-mute">(optional)</span>
              </label>
              <input id="block-reason" className="field" name="reason" placeholder="Travel, exam week…" />
            </div>
            <button className="btn btn-line w-full" type="submit">
              Block this date
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-line bg-paper shadow-[var(--shadow-card)]">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Blocked dates</p>
            <p className="mt-1 text-sm text-mute">
              {blocks.length ? `${blocks.length} upcoming block${blocks.length === 1 ? "" : "s"}` : "None yet"}
            </p>
          </div>
          {blocks.length ? (
            <ul className="divide-y divide-line">
              {blocks.map((block) => (
                <li key={block.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">{formatBlockDate(block.date)}</p>
                    <p className="mt-0.5 truncate text-xs text-mute">{block.reason || "No reason noted"}</p>
                  </div>
                  <form action={removeBlock}>
                    <input type="hidden" name="id" value={block.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-mute transition hover:bg-ivory hover:text-navy"
                      title="Remove block"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid place-items-center px-5 py-10 text-center">
              <CalendarOff className="h-8 w-8 text-line" aria-hidden />
              <p className="mt-3 text-sm font-medium text-navy">Your calendar is clear</p>
              <p className="mt-1 max-w-[16rem] text-xs leading-5 text-mute">
                Blocked days hide all booking slots for that date.
              </p>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

function WindowRow({
  name,
  times,
  value,
  onChange,
}: {
  name: string;
  times: string[];
  value: WindowState;
  onChange: (patch: Partial<WindowState>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`${name}-start`}>
        Start
      </label>
      <select
        id={`${name}-start`}
        className="field !w-auto min-w-[7.5rem]"
        name={`${name}-start`}
        value={value.start}
        onChange={(event) => onChange({ start: event.target.value })}
        required
      >
        <option value="" disabled>
          From
        </option>
        {times.map((time) => (
          <option key={`${name}-s-${time}`} value={time}>
            {labelTime(time)}
          </option>
        ))}
      </select>
      <span className="text-xs font-medium text-mute">to</span>
      <label className="sr-only" htmlFor={`${name}-end`}>
        End
      </label>
      <select
        id={`${name}-end`}
        className="field !w-auto min-w-[7.5rem]"
        name={`${name}-end`}
        value={value.end}
        onChange={(event) => onChange({ end: event.target.value })}
        required
      >
        <option value="" disabled>
          To
        </option>
        {times.map((time) => (
          <option key={`${name}-e-${time}`} value={time}>
            {labelTime(time)}
          </option>
        ))}
      </select>
    </div>
  );
}
