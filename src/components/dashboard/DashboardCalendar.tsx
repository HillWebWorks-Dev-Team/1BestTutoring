"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { SessionList, type SessionItem } from "@/components/dashboard/SessionList";
import { formatTime } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarEvent = Omit<SessionItem, "startsAt" | "endsAt"> & {
  startsAt: string;
  endsAt: string;
};

function eventTone(status: string, selected: boolean) {
  if (selected) return "bg-gold/90 text-deep";
  if (status === "CONFIRMED") return "bg-navy text-ivory";
  if (status === "COMPLETED") return "bg-gold/25 text-navy";
  return "bg-slate/15 text-navy";
}

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
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="card overflow-hidden p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl">{cursor.toFormat("LLLL yyyy")}</h2>
            <p className="mt-1 text-sm text-mute">
              {monthCount} session{monthCount === 1 ? "" : "s"} this month · events show on each day
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

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line text-center text-xs font-semibold uppercase tracking-[0.12em] text-mute">
          {WEEKDAYS.map((day) => (
            <div key={day} className="bg-mist py-2">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-24 bg-paper/70 sm:min-h-28 lg:min-h-32" />;
            const iso = day.toISODate() || "";
            const dayItems = byDay.get(iso) || [];
            const active = dayItems.filter((item) => item.status !== "CANCELLED");
            const isToday = day.hasSame(today, "day");
            const isSelected = iso === selected;
            const visible = active.slice(0, 3);
            const overflow = active.length - visible.length;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`flex min-h-24 flex-col gap-1 bg-paper p-1.5 text-left transition sm:min-h-28 lg:min-h-32 ${
                  isSelected ? "bg-navy text-ivory ring-2 ring-inset ring-gold" : isToday ? "bg-gold/10" : "hover:bg-mist"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday && !isSelected ? "bg-gold text-deep" : isSelected ? "bg-gold text-deep" : "text-navy"
                  } ${isSelected ? "" : ""}`}
                >
                  {day.day}
                </span>
                <span className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {visible.map((item) => {
                    const person = role === "TUTOR" ? item.studentName.split(" ")[0] : item.tutorName.split(" ")[0];
                    const label = item.type === "CONSULTATION" ? "Consult" : "Session";
                    return (
                      <span
                        key={item.id}
                        className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight sm:text-[11px] ${eventTone(item.status, isSelected)}`}
                        title={`${formatTime(item.startsAt, timeZone)} · ${label} · ${person}`}
                      >
                        <span className="hidden sm:inline">{formatTime(item.startsAt, timeZone)} </span>
                        {person}
                        <span className="opacity-80"> · {label}</span>
                      </span>
                    );
                  })}
                  {overflow > 0 ? (
                    <span className={`px-1 text-[10px] ${isSelected ? "text-ivory/75" : "text-mute"}`}>+{overflow} more</span>
                  ) : null}
                </span>
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
