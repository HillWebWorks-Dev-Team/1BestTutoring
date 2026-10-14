"use server";

import { redirect } from "next/navigation";
import { live } from "@/lib/live";
import { getSession, isImpersonating, requireRole, setSessionCookie } from "@/lib/session";

const VIEWABLE = new Set(["TUTOR", "STUDENT", "PARENT"]);

export async function startImpersonation(formData: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const session = await getSession();
  if (isImpersonating(session)) redirect("/dashboard/admin?error=Already viewing as someone else.");

  const userId = String(formData.get("userId") || "").trim();
  if (!userId) redirect("/dashboard/admin?error=Choose someone to view as.");

  const db = await live();
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || !VIEWABLE.has(target.role)) {
    redirect("/dashboard/admin?error=That account can’t be viewed this way.");
  }

  await setSessionCookie({
    uid: target.id,
    role: target.role,
    name: target.name,
    email: target.email,
    impersonatorUid: admin.id,
    impersonatorName: admin.name,
  });

  redirect("/dashboard");
}

export async function stopImpersonation() {
  const session = await getSession();
  if (!session?.impersonatorUid) redirect("/dashboard");

  const db = await live();
  const admin = await db.user.findUnique({ where: { id: session.impersonatorUid } });
  if (!admin || admin.role !== "ADMIN") {
    redirect("/login");
  }

  await setSessionCookie({
    uid: admin.id,
    role: admin.role,
    name: admin.name,
    email: admin.email,
  });

  redirect("/dashboard/admin");
}
