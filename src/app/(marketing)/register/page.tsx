import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1fr]">
      <div>
        <p className="kicker">Students and parents</p>
        <h1 className="display mt-4 text-6xl text-navy">Open an account. Browse freely.</h1>
        <p className="mt-4 text-mute leading-7">You can book free consultations immediately. Paid tutoring, messages, and homework appear after we assign a tutor. Tutors apply on a separate page.</p>
        <Link href="/become-a-tutor" className="mt-6 inline-block text-sm underline">
          I want to tutor instead
        </Link>
      </div>
      <div className="card p-6">
        <RegisterForm referral={params.ref} />
      </div>
    </div>
  );
}
