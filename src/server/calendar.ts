"use server";

import { live } from "@/lib/live";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

function settingsPathFor(role: string) {
  if (role === "TUTOR") return "/dashboard/tutor/settings";
  if (role === "PARENT") return "/dashboard/parent/settings";
  return "/dashboard/student/settings";
}

export async function disconnectGoogleCalendar() {
  const user = await requireUser({ write: true });
  const db = await live();
  await db.user.update({
    where: { id: user.id },
    data: { googleRefreshToken: null },
  });
  redirect(`${settingsPathFor(user.role)}?calendar=disconnected`);
}
