import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function DashboardIndex() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/dashboard/admin");
  if (user.role === "TUTOR") redirect("/dashboard/tutor");
  if (user.role === "PARENT") redirect("/dashboard/parent");
  redirect("/dashboard/student");
}
