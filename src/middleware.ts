import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "opb_session";

async function sessionFrom(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "local-dev-secret-change-before-deploy-1percent",
    );
    const { payload } = await jwtVerify(token, secret);
    return { uid: String(payload.uid), role: String(payload.role) };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  const session = await sessionFrom(request);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const gates: Array<[string, string]> = [
    ["/dashboard/admin", "ADMIN"],
    ["/dashboard/tutor", "TUTOR"],
    ["/dashboard/student", "STUDENT"],
    ["/dashboard/parent", "PARENT"],
  ];
  const gate = gates.find(([prefix]) => pathname.startsWith(prefix));
  if (gate && session.role !== gate[1]) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
