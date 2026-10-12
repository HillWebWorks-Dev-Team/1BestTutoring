import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2">
      <div>
        <p className="kicker">Support</p>
        <h1 className="display mt-4 text-6xl text-navy">Write to the desk.</h1>
        <p className="mt-4 max-w-md leading-7 text-mute">
          Booking trouble, an application question, a billing issue, or a safety concern. Messages land in the admin inbox.
        </p>
        <p className="mt-6 text-sm text-mute">For an urgent safety issue, use this form and choose Safety. A person reviews it.</p>
      </div>
      <div className="card p-6">
        <ContactForm />
      </div>
    </div>
  );
}
