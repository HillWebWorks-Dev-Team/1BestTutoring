"use client";

import { useActionState } from "react";
import { submitContact } from "@/server/apply";
import { SubmitButton } from "@/components/ui";

export function ContactForm() {
  const [state, action] = useActionState(submitContact, null);
  if (state?.ok) return <p className="font-serif text-3xl">Received. We’ll reply from the support desk.</p>;
  return (
    <form action={action} className="grid gap-4">
      {state?.error ? <p className="text-sm text-[#7d332c]">{state.error}</p> : null}
      <label className="label" htmlFor="name">Name</label>
      <input id="name" className="field" name="name" required />
      <label className="label" htmlFor="email">Email</label>
      <input id="email" className="field" name="email" type="email" required />
      <label className="label" htmlFor="topic">Topic</label>
      <select id="topic" className="field" name="topic" defaultValue="Booking help">
        {["Booking help", "A tutor application", "Billing", "Safety", "Something else"].map((topic) => (
          <option key={topic}>{topic}</option>
        ))}
      </select>
      <label className="label" htmlFor="message">Message</label>
      <textarea id="message" className="field min-h-32" name="message" required />
      <SubmitButton>Send</SubmitButton>
    </form>
  );
}
