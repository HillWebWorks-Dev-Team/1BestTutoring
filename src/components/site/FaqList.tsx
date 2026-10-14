"use client";

import { useState } from "react";

export function FaqList({ items }: { items: Array<{ question: string; answer: string }> }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-line">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question} className="border-b border-line">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 py-5 text-left"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : index)}
            >
              <span className="font-serif text-2xl leading-snug text-navy">{item.question}</span>
              <span className="mt-1 shrink-0 text-gold" aria-hidden>
                {expanded ? "−" : "+"}
              </span>
            </button>
            {expanded ? <p className="max-w-3xl pb-5 text-sm leading-7 text-mute">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
