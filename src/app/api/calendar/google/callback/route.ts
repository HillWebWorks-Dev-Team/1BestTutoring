import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/brand";
import { getSession, isImpersonating } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!session || !code) return NextResponse.redirect(`${appUrl()}/login`);
  if (isImpersonating(session)) {
    return NextResponse.redirect(
      `${appUrl()}/dashboard?error=${encodeURIComponent("View-only mode. Return to admin to make changes.")}`,
    );
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${appUrl()}/api/calendar/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const settingsPath =
    session.role === "TUTOR"
      ? "/dashboard/tutor/settings"
      : session.role === "PARENT"
        ? "/dashboard/parent/settings"
        : "/dashboard/student/settings";
  if (!response.ok) {
    return NextResponse.redirect(
      `${appUrl()}${settingsPath}?error=${encodeURIComponent("Google Calendar could not be connected.")}`,
    );
  }
  const json = (await response.json()) as { refresh_token?: string };
  if (json.refresh_token) {
    await prisma.user.update({ where: { id: session.uid }, data: { googleRefreshToken: json.refresh_token } });
  }
  return NextResponse.redirect(`${appUrl()}${settingsPath}?calendar=connected`);
}
