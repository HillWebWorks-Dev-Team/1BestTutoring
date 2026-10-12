import type { Metadata } from "next";
import { FaqList } from "@/components/site/FaqList";
import { FAQS } from "@/lib/content";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="kicker">FAQ</p>
      <h1 className="display mt-4 text-6xl text-navy">Straight answers.</h1>
      <div className="mt-8">
        <FaqList items={FAQS} />
      </div>
    </div>
  );
}
