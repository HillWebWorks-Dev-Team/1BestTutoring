"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { bookSlot, getOpenSlots } from "@/server/booking";
import { formatTime } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingCalendar({
  slug,
  type,
  tutorTimeZone,
  viewerTimeZone,
  priceLabel,
  rescheduleId,
  studentId,
  lockedReason,
}: {
  slug: string;
  type: "CONSULTATION" | "SESSION";
  tutorTimeZone: string;
  viewerTimeZone: string;
  priceLabel: string;
  rescheduleId?: string;
  studentId?: string;
  lockedReason?: string;
}) {
  const [cursor, setCursor] = useState(() => DateTime.now().setZone(tutorTimeZone).startOf("month"));
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const days = useMemo(() => {
    const start = cursor.startOf("month");
    const leading = start.weekday % 7;
    const cells: Array<DateTime | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= (cursor.daysInMonth ?? 31); day += 1) cells.push(start.set({ day }));
    return cells;
  }, [cursor]);

  async function choose(day: DateTime) {
    const iso = day.toISODate();
    if (!iso) return;
    setDate(iso);
    setSelected(null);
    setError(null);
    setLoading(true);
    const next = await getOpenSlots(slug, iso, type, rescheduleId);
    setSlots(next);
    setLoading(false);
  }

  async function confirm() {
    if (!selected || lockedReason) return;
    setPending(true);
    setError(null);
    const result = await bookSlot({ slug, startsAt: selected, type, rescheduleId, studentId });
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = result.next || "/dashboard";
  }

  const today = DateTime.now().setZone(tutorTimeZone).startOf("day");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn btn-line" type="button" onClick={() => setCursor(cursor.minus({ months: 1 }))}>
            Prev
          </button>
          <p className="font-serif text-2xl">{cursor.toFormat("LLLL yyyy")}</p>
          <button className="btn btn-line" type="button" onClick={() => setCursor(cursor.plus({ months: 1 }))}>
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-mute">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;
            const iso = day.toISODate();
            const disabled = day < today;
            const active = iso === date;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => choose(day)}
                className={`rounded-xl py-3 text-sm ${active ? "bg-navy text-ivory" : "hover:bg-mist"} disabled:text-line`}
              >
                {day.day}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-mute">
          Dates follow the tutor’s calendar ({tutorTimeZone.replaceAll("_", " ")}). Times below are shown in yours ({viewerTimeZone.replaceAll("_", " ")}).
        </p>
      </div>
      <div className="card flex flex-col p-5">
        <p className="kicker">{type === "CONSULTATION" ? "15 minutes · free" : priceLabel}</p>
        <h2 className="mt-2 font-serif text-3xl">{date ? DateTime.fromISO(date).toFormat("cccc, LLL d") : "Choose a date"}</h2>
        {lockedReason ? <p className="mt-4 text-sm leading-6 text-mute">{lockedReason}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {loading ? <p className="text-sm text-mute">Checking the calendar…</p> : null}
          {!loading && date && slots.length === 0 ? <p className="col-span-2 text-sm text-mute">No open times on this date.</p> : null}
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelected(slot)}
              className={`rounded-xl border px-3 py-3 text-sm ${selected === slot ? "border-gold bg-navy text-ivory" : "border-line bg-white"}`}
            >
              {formatTime(new Date(slot), viewerTimeZone)}
            </button>
          ))}
        </div>
        {error ? <p className="mt-4 text-sm text-[#7d332c]">{error}</p> : null}
        <button className="btn btn-primary mt-auto" type="button" disabled={!selected || pending || Boolean(lockedReason)} onClick={confirm}>
          {pending ? "Confirming…" : type === "CONSULTATION" ? "Confirm free consultation" : "Confirm and pay"}
        </button>
      </div>
    </div>
  );
}
