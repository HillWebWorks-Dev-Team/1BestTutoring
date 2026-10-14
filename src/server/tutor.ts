"use server";

import { redirect } from "next/navigation";
import { live, platformSettings } from "@/lib/live";
import { notifyAdmins } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/brand";

const QUALIFICATIONS = [
  "university",
  "major",
  "degree",
  "graduationYear",
  "achievements",
  "certifications",
  "testScores",
  "subjects",
  "gradeLevels",
] as const;

export async function updateTutorProfile(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  if (user.tutorProfile.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const settings = await platformSettings();
  const hourlyRateCents = Math.round(Number(formData.get("hourlyRate")) * 100);
  if (hourlyRateCents < settings.minHourlyRateCents || hourlyRateCents > settings.maxHourlyRateCents) {
    redirect(`/dashboard/tutor/profile?error=Rates must stay between $${settings.minHourlyRateCents / 100} and $${settings.maxHourlyRateCents / 100}.`);
  }

  const subjects = formData.getAll("subjects").map(String).join(", ");
  const gradeLevels = formData.getAll("gradeLevels").map(String).join(", ");
  const nextQualifications = {
    university: String(formData.get("university") || ""),
    major: String(formData.get("major") || ""),
    degree: String(formData.get("degree") || ""),
    graduationYear: Number(formData.get("graduationYear") || user.tutorProfile.graduationYear),
    achievements: String(formData.get("achievements") || ""),
    certifications: String(formData.get("certifications") || ""),
    testScores: String(formData.get("testScores") || ""),
    subjects,
    gradeLevels,
  };
  const current = user.tutorProfile;
  const changed = QUALIFICATIONS.some((key) => String(current[key] ?? "") !== String(nextQualifications[key] ?? ""));
  const db = await live();
  await db.tutorProfile.update({
    where: { id: current.id },
    data: {
      bio: String(formData.get("bio") || current.bio),
      experience: String(formData.get("experience") || current.experience),
      education: String(formData.get("education") || current.education),
      availabilityNotes: String(formData.get("availabilityNotes") || ""),
      introVideoUrl: String(formData.get("introVideoUrl") || "") || null,
      hourlyRateCents,
      pendingChanges: changed ? JSON.stringify(nextQualifications) : current.pendingChanges,
    },
  });
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0 && photo.type.startsWith("image/") && photo.size < 4 * 1024 * 1024) {
    const doc = await db.document.create({
      data: {
        userId: user.id,
        kind: "PROFILE_PHOTO",
        fileName: photo.name.slice(0, 140),
        mimeType: photo.type,
        data: Buffer.from(await photo.arrayBuffer()),
      },
    });
    await db.user.update({ where: { id: user.id }, data: { imageUrl: `/api/media/${doc.id}` } });
  }
  if (changed) {
    await notifyAdmins({
      type: "PROFILE",
      title: `${user.name} submitted qualification changes`,
      body: "Review the pending university, subject, or credential edits.",
      href: "/dashboard/admin/tutors",
      dedupeKey: `qual:${current.id}:${Date.now()}`,
    });
  }
  redirect("/dashboard/tutor/profile?saved=1");
}

export async function saveAvailability(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile || user.tutorProfile.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const rules: Array<{ dayOfWeek: number; startMin: number; endMin: number }> = [];
  for (let day = 0; day < 7; day += 1) {
    for (const slot of ["a", "b"]) {
      const start = String(formData.get(`${day}-${slot}-start`) || "");
      const end = String(formData.get(`${day}-${slot}-end`) || "");
      if (!start || !end) continue;
      const startMin = toMinutes(start);
      const endMin = toMinutes(end);
      if (endMin > startMin) rules.push({ dayOfWeek: day, startMin, endMin });
    }
  }
  const db = await live();
  await db.$transaction([
    db.availabilityRule.deleteMany({ where: { tutorId: user.tutorProfile.id } }),
    db.availabilityRule.createMany({ data: rules.map((rule) => ({ ...rule, tutorId: user.tutorProfile!.id })) }),
  ]);
  redirect("/dashboard/tutor/availability?saved=1");
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function blockDate(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  const date = String(formData.get("date") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/dashboard/tutor/availability?error=Choose a date.");
  const db = await live();
  await db.availabilityBlock.create({
    data: { tutorId: user.tutorProfile.id, date, reason: String(formData.get("reason") || "") },
  });
  redirect("/dashboard/tutor/availability?saved=1");
}

export async function removeBlock(formData: FormData) {
  const user = await requireUser();
  if (!user.tutorProfile) redirect("/dashboard");
  const db = await live();
  await db.availabilityBlock.deleteMany({
    where: { id: String(formData.get("id")), tutorId: user.tutorProfile.id },
  });
  redirect("/dashboard/tutor/availability?saved=1");
}

export async function startStripeConnect() {
  const user = await requireUser();
  if (!user.tutorProfile || user.tutorProfile.status !== "APPROVED") redirect("/dashboard/tutor/application");
  const stripe = getStripe();
  if (!stripe) redirect("/dashboard/tutor/earnings?error=Add Stripe keys to turn on live payouts. Demo payments still record the 70/30 split.");
  const db = await live();
  let accountId = user.tutorProfile.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { product_description: "Independent tutoring on 1% Better Tutoring" },
    });
    accountId = account.id;
    await db.tutorProfile.update({ where: { id: user.tutorProfile.id }, data: { stripeAccountId: accountId } });
  }
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appUrl()}/dashboard/tutor/earnings?stripe=refresh`,
    return_url: `${appUrl()}/dashboard/tutor/earnings?stripe=return`,
  });
  redirect(link.url);
}

export async function syncStripeAccount() {
  const user = await requireUser();
  if (!user.tutorProfile?.stripeAccountId) return user.tutorProfile;
  const stripe = getStripe();
  if (!stripe) return user.tutorProfile;
  const account = await stripe.accounts.retrieve(user.tutorProfile.stripeAccountId);
  const db = await live();
  return db.tutorProfile.update({
    where: { id: user.tutorProfile.id },
    data: {
      stripeChargesEnabled: Boolean(account.charges_enabled),
      stripePayoutsEnabled: Boolean(account.payouts_enabled),
      stripeDetailsSubmitted: Boolean(account.details_submitted),
    },
  });
}

export async function updateTutorAccountSettings(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "TUTOR") redirect("/dashboard");
  const db = await live();
  await db.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") || user.name),
      phone: String(formData.get("phone") || "") || null,
      timezone: String(formData.get("timezone") || user.timezone),
    },
  });
  redirect("/dashboard/tutor/settings?saved=1");
}
