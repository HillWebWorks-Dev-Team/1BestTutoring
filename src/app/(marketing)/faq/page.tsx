import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/site/FaqList";
import { FAQS } from "@/lib/content";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div>
      <section className="bg-deep text-ivory">
        <div className="shell py-16 md:py-20">
          <p className="kicker">FAQ</p>
          <h1 className="display mt-4 max-w-3xl text-5xl text-ivory md:text-6xl">Straight answers.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ivory/75">
            How consultations, matching, payments, and tutor approval actually work.
          </p>
        </div>
      </section>

      <section className="bg-ivory py-14">
        <div className="shell max-w-3xl">
          <FaqList items={FAQS} />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-primary">
              Contact us
            </Link>
            <Link href="/tutors" className="btn btn-line">
              Browse tutors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
