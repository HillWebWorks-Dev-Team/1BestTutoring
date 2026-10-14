"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GRADE_LEVELS } from "@/lib/brand";
import { live } from "@/lib/live";
import { referralCode } from "@/lib/format";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { notifyAdmins } from "@/lib/notify";

export async function login(_state: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");
  if (!email || !password) return { error: "Enter your email address and password." };
  try {
    const db = await live();
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return { error: "That email and password don’t match." };
    }
    await setSessionCookie({ uid: user.id, role: user.role, name: user.name, email: user.email });
  } catch {
    return { error: "We couldn’t sign you in right now. Please try again shortly." };
  }
  // Only allow local paths; protocol-relative URLs and backslashes can leave the site.
  redirect(next.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u0020]/.test(next) ? next : "/dashboard");
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  role: z.enum(["STUDENT", "PARENT"]),
  timezone: z.string().min(1),
  gradeLevel: z.string().optional(),
  guardianEmail: z.string().optional(),
  referral: z.string().optional(),
});

export async function register(_state: { error?: string } | null, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    timezone: formData.get("timezone") || "America/New_York",
    gradeLevel: formData.get("gradeLevel") || undefined,
    guardianEmail: formData.get("guardianEmail") || undefined,
    referral: formData.get("referral") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form and try again." };

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const db = await live();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists. Sign in instead." };

  const guardianEmail = data.guardianEmail?.trim().toLowerCase() || null;
  const isMinor = data.gradeLevel === "Middle School" || Boolean(guardianEmail);
  if (data.role === "STUDENT" && data.gradeLevel && !GRADE_LEVELS.includes(data.gradeLevel as (typeof GRADE_LEVELS)[number])) {
    return { error: "Choose a grade level." };
  }

  const referralCodeInput = data.referral?.trim().toUpperCase() || "";
  let referrerProfile: { userId: string; referralCode: string } | null = null;
  if (data.role === "STUDENT" && referralCodeInput) {
    referrerProfile = await db.studentProfile.findUnique({
      where: { referralCode: referralCodeInput },
      select: { userId: true, referralCode: true },
    });
    if (!referrerProfile) return { error: "That referral code isn’t recognized." };
  }

  const user = await db.user.create({
    data: {
      name: data.name,
      email,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: data.role,
      timezone: data.timezone,
      studentProfile:
        data.role === "STUDENT"
          ? {
              create: {
                gradeLevel: data.gradeLevel || "High School",
                guardianEmail,
                isMinor,
                referralCode: referralCode(data.name),
                referredByCode: referrerProfile?.referralCode || null,
              },
            }
          : undefined,
      parentProfile: data.role === "PARENT" ? { create: {} } : undefined,
    },
  });

  if (data.role === "STUDENT" && referrerProfile) {
    await db.referral.create({
      data: {
        code: referrerProfile.referralCode,
        referrerUserId: referrerProfile.userId,
        referredUserId: user.id,
      },
    });
  }

  await notifyAdmins({
    type: "REGISTRATION",
    title: `New ${data.role === "PARENT" ? "parent" : "student"} account`,
    body: `${data.name} created an account.`,
    href: "/dashboard/admin/students",
    dedupeKey: `register:${user.id}`,
  });

  await setSessionCookie({ uid: user.id, role: user.role, name: user.name, email: user.email });
  redirect("/dashboard");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}
