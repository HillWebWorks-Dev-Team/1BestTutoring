"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { SessionList, type SessionItem } from "@/components/dashboard/SessionList";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarEvent = Omit<SessionItem, "startsAt" | "endsAt"> & {
  startsAt: string;
  endsAt: string;
};

export function DashboardCalendar({
  events,
  role,
  timeZone,
}: {
  events: CalendarEvent[];
  role: "STUDENT" | "TUTOR" | "PARENT" | "ADMIN";
  timeZone: string;
}) {
  const items = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
      })),
    [events],
  );

  const [cursor, setCursor] = useState(() => DateTime.now().setZone(timeZone).startOf("month"));
  const [selected, setSelected] = useState(() => DateTime.now().setZone(timeZone).toISODate() || "");

  const byDay = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const item of items) {
      const key = DateTime.fromJSDate(item.startsAt).setZone(timeZone).toISODate();
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    }
    return map;
  }, [items, timeZone]);

  const days = useMemo(() => {
    const start = cursor.startOf("month");
    const leading = start.weekday % 7;
    const cells: Array<DateTime | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= (cursor.daysInMonth ?? 31); day += 1) {
      cells.push(start.set({ day }));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const today = DateTime.now().setZone(timeZone).startOf("day");
  const selectedItems = selected ? byDay.get(selected) || [] : [];
  const selectedLabel = selected
    ? DateTime.fromISO(selected, { zone: timeZone }).toFormat("cccc, LLL d")
    : "Choose a day";

  const monthCount = items.filter((item) => {
    const day = DateTime.fromJSDate(item.startsAt).setZone(timeZone);
    return day.month === cursor.month && day.year === cursor.year && item.status !== "CANCELLED";
  }).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl">{cursor.toFormat("LLLL yyyy")}</h2>
            <p className="mt-1 text-sm text-mute">
              {monthCount} session{monthCount === 1 ? "" : "s"} this month
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-line"
              type="button"
              onClick={() => {
                const now = DateTime.now().setZone(timeZone);
                setCursor(now.startOf("month"));
                setSelected(now.toISODate() || "");
              }}
            >
              Today
            </button>
            <button className="btn btn-line" type="button" onClick={() => setCursor(cursor.minus({ months: 1 }))}>
              Prev
            </button>
            <button className="btn btn-line" type="button" onClick={() => setCursor(cursor.plus({ months: 1 }))}>
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-[0.12em] text-mute">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-16 rounded-lg bg-transparent sm:min-h-20" />;
            const iso = day.toISODate() || "";
            const dayItems = byDay.get(iso) || [];
            const active = dayItems.filter((item) => item.status !== "CANCELLED");
            const isToday = day.hasSame(today, "day");
            const isSelected = iso === selected;
            const hasConfirmed = active.some((item) => item.status === "CONFIRMED");
            const hasCompleted = active.some((item) => item.status === "COMPLETED");

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`min-h-16 rounded-lg border p-1.5 text-left transition sm:min-h-20 ${
                  isSelected
                    ? "border-navy bg-navy text-ivory"
                    : isToday
                      ? "border-gold bg-gold/10 text-navy"
                      : active.length
                        ? "border-line bg-paper hover:border-gold/50"
                        : "border-transparent text-mute hover:border-line hover:bg-paper"
                }`}
              >
                <span className={`block text-sm font-semibold ${isSelected ? "text-ivory" : ""}`}>{day.day}</span>
                {active.length ? (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {active.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? "bg-gold"
                            : item.status === "CONFIRMED"
                              ? "bg-navy"
                              : item.status === "COMPLETED"
                                ? "bg-gold"
                                : "bg-slate"
                        }`}
                        title={`${item.type === "CONSULTATION" ? "Consult" : "Session"} · ${item.status}`}
                      />
                    ))}
                    {active.length > 3 ? (
                      <span className={`text-[10px] ${isSelected ? "text-ivory/70" : "text-mute"}`}>+{active.length - 3}</span>
                    ) : null}
                  </span>
                ) : null}
                {active.length === 1 && !isSelected ? (
                  <span className="mt-1 hidden truncate text-[10px] leading-tight text-mute sm:block">
                    {role === "TUTOR" ? active[0].studentName.split(" ")[0] : active[0].tutorName.split(" ")[0]}
                    {hasConfirmed ? "" : hasCompleted ? " · done" : ""}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-mute">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-navy" /> Confirmed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold" /> Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-gold bg-gold/20" /> Today
          </span>
        </div>
      </div>

      <div>
        <p className="kicker">Selected day</p>
        <h2 className="mt-2 font-serif text-3xl">{selectedLabel}</h2>
        <p className="mt-1 text-sm text-mute">
          {selectedItems.length
            ? `${selectedItems.length} booking${selectedItems.length === 1 ? "" : "s"}`
            : "No bookings on this day."}
        </p>
        <div className="mt-4">
          {selectedItems.length ? (
            <SessionList items={selectedItems} role={role} timeZone={timeZone} compact />
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-8 text-sm text-mute">
              Pick another day, or book a new session from your tutors.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
