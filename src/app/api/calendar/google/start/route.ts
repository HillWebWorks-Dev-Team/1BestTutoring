import { NextResponse } from "next/server";
import { appUrl } from "@/lib/brand";
import { googleAuthUrl, googleConfigured } from "@/lib/google";
import { getSession, isImpersonating } from "@/lib/session";

function settingsPath(role: string) {
  if (role === "TUTOR") return "/dashboard/tutor/settings";
  if (role === "PARENT") return "/dashboard/parent/settings";
  return "/dashboard/student/settings";
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", appUrl()));
  if (isImpersonating(session)) {
    return NextResponse.redirect(
      new URL(
        `${settingsPath(session.role)}?error=${encodeURIComponent("View-only mode. Return to admin to make changes.")}`,
        appUrl(),
      ),
    );
  }
  if (!googleConfigured()) {
    const message =
      "Add Google OAuth keys to connect calendars. You can still download an .ics file from any booking.";
    return NextResponse.redirect(
      new URL(`${settingsPath(session.role)}?error=${encodeURIComponent(message)}`, appUrl()),
    );
  }
  return NextResponse.redirect(googleAuthUrl(session.uid));
}
