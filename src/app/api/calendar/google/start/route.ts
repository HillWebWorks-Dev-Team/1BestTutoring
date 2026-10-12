import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured } from "@/lib/google";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/dashboard/student/settings?error=Add Google OAuth keys to connect calendars. You can still download an .ics file from any booking.", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  return NextResponse.redirect(googleAuthUrl(session.uid));
}
