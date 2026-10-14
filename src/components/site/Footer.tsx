import Link from "next/link";
import { Logo } from "@/components/brand";
import { UNIVERSITY_DISCLAIMER } from "@/lib/universities";

export function Footer() {
  return (
    <footer className="mt-0 bg-deep text-ivory">
      <div className="shell grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-6 text-ivory/70">
            Verified tutors from the Ivy League and other leading universities. Small steps, lasting academic progress.
          </p>
          <Link href="/become-a-tutor" className="mt-5 inline-block text-sm text-gold hover:text-ivory">
            Apply to tutor
          </Link>
        </div>
        <div>
          <p className="kicker">Explore</p>
          <div className="mt-4 grid gap-2 text-sm text-ivory/80">
            <Link href="/tutors" className="hover:text-ivory">Tutor directory</Link>
            <Link href="/subjects" className="hover:text-ivory">Subjects</Link>
            <Link href="/how-it-works" className="hover:text-ivory">How it works</Link>
            <Link href="/#reviews" className="hover:text-ivory">Reviews</Link>
          </div>
        </div>
        <div>
          <p className="kicker">Company</p>
          <div className="mt-4 grid gap-2 text-sm text-ivory/80">
            <Link href="/about" className="hover:text-ivory">About</Link>
            <Link href="/become-a-tutor" className="hover:text-ivory">Become a tutor</Link>
            <Link href="/contact" className="hover:text-ivory">Contact</Link>
            <Link href="/safety" className="hover:text-ivory">Safety</Link>
          </div>
        </div>
        <div>
          <p className="kicker">Support</p>
          <div className="mt-4 grid gap-2 text-sm text-ivory/80">
            <Link href="/faq" className="hover:text-ivory">FAQ</Link>
            <Link href="/contact" className="hover:text-ivory">Help desk</Link>
            <Link href="/privacy" className="hover:text-ivory">Privacy policy</Link>
            <Link href="/terms" className="hover:text-ivory">Terms</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-3 py-6 text-xs leading-5 text-ivory/45 md:flex-row md:items-end md:justify-between">
          <p className="max-w-3xl">{UNIVERSITY_DISCLAIMER}</p>
          <p className="shrink-0">© {new Date().getFullYear()} 1% Better Tutoring</p>
        </div>
      </div>
    </footer>
  );
}
