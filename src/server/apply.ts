"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { resolveSelectOther } from "@/lib/apply-options";
import { GRADE_LEVELS, SUBJECTS } from "@/lib/brand";
import { slugify } from "@/lib/format";
import { live, platformSettings } from "@/lib/live";
import { notifyAdmins } from "@/lib/notify";
import { getSession, isImpersonating, setSessionCookie } from "@/lib/session";

const ALLOWED_FILES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"];
const ALLOWED_PHOTOS = ["image/png", "image/jpeg", "image/webp"];

async function saveDocument(userId: string, file: FormDataEntryValue | null, kind: string) {
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 4 * 1024 * 1024) throw new Error("Each file must be 4MB or smaller.");
  if (!ALLOWED_FILES.includes(file.type)) throw new Error("Upload a PDF, image, or text file.");
  const db = await live();
  await db.document.create({
    data: {
      userId,
      kind,
      fileName: file.name.slice(0, 140),
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    },
  });
}

async function saveProfilePhoto(userId: string, file: FormDataEntryValue | null, required: boolean) {
  if (!(file instanceof File) || file.size === 0) {
    if (required) throw new Error("Add a profile photo before submitting.");
    return;
  }
  if (file.size > 4 * 1024 * 1024) throw new Error("Profile photo must be 4MB or smaller.");
  if (!ALLOWED_PHOTOS.includes(file.type)) throw new Error("Profile photo must be a PNG, JPG, or WebP image.");
  const db = await live();
  const doc = await db.document.create({
    data: {
      userId,
      kind: "PROFILE_PHOTO",
      fileName: file.name.slice(0, 140),
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    },
  });
  await db.user.update({ where: { id: userId }, data: { imageUrl: `/api/media/${doc.id}` } });
}

export async function submitContact(_state: { error?: string; ok?: boolean } | null, formData: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      email: z.string().trim().email(),
      topic: z.string().trim().min(2),
      message: z.string().trim().min(10),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      message: formData.get("message"),
    });
  if (!parsed.success) return { error: "Add your name, email, topic, and a short message." };
  const db = await live();
  await db.contactMessage.create({ data: parsed.data });
  await notifyAdmins({
    type: "CONTACT",
    title: `Support note from ${parsed.data.name}`,
    body: parsed.data.message.slice(0, 180),
    href: "/dashboard/admin/inbox",
  });
  return { ok: true };
}

export async function applyAsTutor(_state: { error?: string } | null, formData: FormData) {
  const subjects = formData.getAll("subjects").map(String);
  const gradeLevels = formData.getAll("gradeLevels").map(String);
  const university = resolveSelectOther(String(formData.get("university") || ""), String(formData.get("universityOther") || ""));
  const major = resolveSelectOther(String(formData.get("major") || ""), String(formData.get("majorOther") || ""));
  const degree = resolveSelectOther(String(formData.get("degree") || ""), String(formData.get("degreeOther") || ""));
  const graduationYearRaw = resolveSelectOther(
    String(formData.get("graduationYear") || ""),
    String(formData.get("graduationYearOther") || ""),
  );
  const hourlyRateRaw = resolveSelectOther(String(formData.get("hourlyRate") || ""), String(formData.get("hourlyRateOther") || ""));
  const experience = resolveSelectOther(String(formData.get("experience") || ""), String(formData.get("experienceOther") || ""));
  const education = resolveSelectOther(String(formData.get("education") || ""), String(formData.get("educationOther") || ""));
  const achievements = resolveSelectOther(
    String(formData.get("achievements") || ""),
    String(formData.get("achievementsOther") || ""),
  );
  const certifications = resolveSelectOther(
    String(formData.get("certifications") || ""),
    String(formData.get("certificationsOther") || ""),
  );
  const testScores = resolveSelectOther(String(formData.get("testScores") || ""), String(formData.get("testScoresOther") || ""));

  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your name."),
      email: z.string().trim().email("Enter a valid email."),
      password: z.string().optional(),
      university: z.string().trim().min(2, "Choose your university."),
      major: z.string().trim().min(2, "Choose your major."),
      degree: z.string().trim().min(2, "Choose your degree."),
      graduationYear: z.coerce.number().min(1970).max(2045),
      bio: z.string().trim().min(40, "Write a short biography of at least a few sentences."),
      experience: z.string().trim().min(2, "Choose your tutoring or teaching experience."),
      education: z.string().trim().min(2, "Choose your educational background."),
      achievements: z.string().optional(),
      certifications: z.string().optional(),
      testScores: z.string().optional(),
      hourlyRate: z.coerce.number().positive("Enter an hourly rate."),
      availabilityNotes: z.string().optional(),
      introVideoUrl: z.string().optional(),
      linkedinUrl: z.string().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password") || undefined,
      university,
      major,
      degree,
      graduationYear: graduationYearRaw,
      bio: formData.get("bio"),
      experience,
      education,
      achievements,
      certifications,
      testScores,
      hourlyRate: hourlyRateRaw,
      availabilityNotes: formData.get("availabilityNotes"),
      introVideoUrl: formData.get("introVideoUrl"),
      linkedinUrl: formData.get("linkedinUrl"),
    });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the application and try again." };
  if (!subjects.length || subjects.some((subject) => !SUBJECTS.includes(subject as (typeof SUBJECTS)[number]))) {
    return { error: "Select at least one subject you teach." };
  }
  if (!gradeLevels.length || gradeLevels.some((level) => !GRADE_LEVELS.includes(level as (typeof GRADE_LEVELS)[number]))) {
    return { error: "Select the grade levels you tutor." };
  }

  const settings = await platformSettings();
  const hourlyRateCents = Math.round(parsed.data.hourlyRate * 100);
  if (hourlyRateCents < settings.minHourlyRateCents || hourlyRateCents > settings.maxHourlyRateCents) {
    return {
      error: `Hourly rates must be between $${settings.minHourlyRateCents / 100} and $${settings.maxHourlyRateCents / 100}.`,
    };
  }

  const db = await live();
  const session = await getSession();
  if (isImpersonating(session)) {
    return { error: "View-only mode. Return to admin to make changes." };
  }
  const email = parsed.data.email.toLowerCase();

  try {
    if (session) {
      const current = await db.user.findUnique({ where: { id: session.uid }, include: { tutorProfile: true } });
      if (!current || current.role !== "TUTOR" || !current.tutorProfile) {
        return { error: "Sign out, then submit the application with the email you want on your tutor account." };
      }
      if (current.tutorProfile.status === "APPROVED") redirect("/dashboard/tutor/profile");
      await db.tutorProfile.update({
        where: { id: current.tutorProfile.id },
        data: {
          ...profileData(parsed.data, subjects, gradeLevels, hourlyRateCents),
          status: "PENDING",
          active: false,
          verified: false,
        },
      });
      await saveProfilePhoto(current.id, formData.get("photo"), !current.imageUrl);
      await saveDocument(current.id, formData.get("resume"), "RESUME");
      await saveDocument(current.id, formData.get("credentials"), "CREDENTIAL");
      await saveDocument(current.id, formData.get("proof"), "ENROLLMENT_PROOF");
      await notifyAdmins({
        type: "APPLICATION",
        title: `${current.name} updated a tutor application`,
        body: `${parsed.data.university} · ${parsed.data.major}`,
        href: "/dashboard/admin/applications",
        dedupeKey: `apply-update:${current.tutorProfile.id}:${Date.now()}`,
      });
      redirect("/dashboard/tutor/application?submitted=1");
    }

    if (!parsed.data.password || parsed.data.password.length < 8) {
      return { error: "Create a password with at least 8 characters." };
    }
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "That email already has an account. Sign in to continue an application." };

    let slug = slugify(parsed.data.name);
    const slugTaken = await db.tutorProfile.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: "TUTOR",
        timezone: "America/New_York",
        tutorProfile: {
          create: {
            slug,
            ...profileData(parsed.data, subjects, gradeLevels, hourlyRateCents),
            status: "PENDING",
          },
        },
      },
    });
    await saveProfilePhoto(user.id, formData.get("photo"), true);
    await saveDocument(user.id, formData.get("resume"), "RESUME");
    await saveDocument(user.id, formData.get("credentials"), "CREDENTIAL");
    await saveDocument(user.id, formData.get("proof"), "ENROLLMENT_PROOF");
    await notifyAdmins({
      type: "APPLICATION",
      title: `Tutor application from ${parsed.data.name}`,
      body: `${parsed.data.university} · ${parsed.data.major}`,
      href: "/dashboard/admin/applications",
      dedupeKey: `apply:${user.id}`,
    });
    await setSessionCookie({ uid: user.id, role: "TUTOR", name: user.name, email: user.email });
    redirect("/dashboard/tutor/application?submitted=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    if (typeof error === "object" && error && "digest" in error) throw error;
    return { error: error instanceof Error ? error.message : "We couldn’t submit that application." };
  }
}

function profileData(
  data: {
    university: string;
    major: string;
    degree: string;
    graduationYear: number;
    bio: string;
    experience: string;
    education?: string;
    achievements?: string;
    certifications?: string;
    testScores?: string;
    availabilityNotes?: string;
    introVideoUrl?: string;
    linkedinUrl?: string;
  },
  subjects: string[],
  gradeLevels: string[],
  hourlyRateCents: number,
) {
  const linkedinUrl = data.linkedinUrl?.trim() || "";
  return {
    university: data.university,
    major: data.major,
    degree: data.degree,
    graduationYear: data.graduationYear,
    bio: data.bio,
    experience: data.experience,
    education: data.education || `${data.degree} in ${data.major}, ${data.university}`,
    achievements: data.achievements || "",
    certifications: data.certifications || "",
    testScores: data.testScores || "",
    subjects: subjects.join(", "),
    gradeLevels: gradeLevels.join(", "),
    hourlyRateCents,
    availabilityNotes: data.availabilityNotes || "",
    introVideoUrl: data.introVideoUrl || null,
    linkedinUrl: linkedinUrl || null,
  };
}

export async function reportConcern(_state: { error?: string; ok?: boolean } | null, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sign in to send a report." };
  if (isImpersonating(session)) return { error: "View-only mode. Return to admin to make changes." };
  const details = String(formData.get("details") || "").trim();
  const reason = String(formData.get("reason") || "Concern");
  if (details.length < 8) return { error: "Tell us what happened in a sentence or two." };
  const db = await live();
  await db.safetyReport.create({
    data: {
      reporterId: session.uid,
      subjectUserId: String(formData.get("subjectUserId") || "") || null,
      reason,
      details,
    },
  });
  await notifyAdmins({
    type: "SAFETY",
    title: "New safety report",
    body: details.slice(0, 180),
    href: "/dashboard/admin/safety",
  });
  return { ok: true };
}
