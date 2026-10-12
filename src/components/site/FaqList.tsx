"use client";

import { useState } from "react";

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question}>
            <button
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? -1 : index)}
            >
              <span className="font-serif text-2xl tracking-tight">{item.question}</span>
              <span className="text-gold">{expanded ? "–" : "+"}</span>
            </button>
            {expanded ? <p className="max-w-3xl pb-5 text-sm leading-7 text-mute">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
