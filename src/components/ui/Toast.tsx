"use client";

import { useEffect, useSyncExternalStore } from "react";
import { X } from "lucide-react";

type ToastTone = "error" | "success" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

let nextId = 1;
let items: ToastItem[] = [];
const EMPTY: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(message: string, tone: ToastTone) {
  const trimmed = message.trim();
  if (!trimmed) return;
  items = [...items, { id: nextId++, message: trimmed, tone }].slice(-5);
  emit();
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

export const toast = {
  error(message: string) {
    push(message, "error");
  },
  success(message: string) {
    push(message, "success");
  },
  info(message: string) {
    push(message, "info");
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), 5200);
    return () => window.clearTimeout(timer);
  }, [item.id]);

  const toneClass =
    item.tone === "error"
      ? "border-[#e7c7c2] bg-[#fbf1ef] text-[#7d332c]"
      : item.tone === "success"
        ? "border-gold/35 bg-cream/95 text-navy"
        : "border-line bg-white text-navy";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_18px_40px_-24px_rgb(11_29_51_/_0.55)] ${toneClass}`}
    >
      <p className="min-w-0 flex-1 leading-6">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        className="mt-0.5 shrink-0 text-current/70 hover:text-current"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
