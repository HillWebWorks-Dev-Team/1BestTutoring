import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { live } from "./live";

export type SessionPayload = {
  uid: string;
  role: string;
  name: string;
  email: string;
  impersonatorUid?: string;
  impersonatorName?: string;
};

const COOKIE = "opb_session";

function secret() {
  const value = process.env.AUTH_SECRET || "local-dev-secret-change-before-deploy-1percent";
  return new TextEncoder().encode(value);
}

export function isImpersonating(session: SessionPayload | null | undefined) {
  return Boolean(session?.impersonatorUid);
}

export async function signSession(payload: SessionPayload) {
  const claims: Record<string, string> = {
    uid: payload.uid,
    role: payload.role,
    name: payload.name,
    email: payload.email,
  };
  if (payload.impersonatorUid) claims.impersonatorUid = payload.impersonatorUid;
  if (payload.impersonatorName) claims.impersonatorName = payload.impersonatorName;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function readSession(token: string) {
  const { payload } = await jwtVerify(token, secret());
  const session: SessionPayload = {
    uid: String(payload.uid),
    role: String(payload.role),
    name: String(payload.name),
    email: String(payload.email),
  };
  if (payload.impersonatorUid) session.impersonatorUid = String(payload.impersonatorUid);
  if (payload.impersonatorName) session.impersonatorName = String(payload.impersonatorName);
  return session;
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await readSession(token);
  } catch {
    return null;
  }
}

export async function requireUser(options?: { write?: boolean }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (options?.write && isImpersonating(session)) {
    const home =
      session.role === "TUTOR"
        ? "/dashboard/tutor"
        : session.role === "PARENT"
          ? "/dashboard/parent"
          : session.role === "ADMIN"
            ? "/dashboard/admin"
            : "/dashboard/student";
    redirect(
      `${home}?error=${encodeURIComponent("View-only mode. Return to admin to make changes.")}`,
    );
  }
  const db = await live();
  const user = await db.user.findUnique({
    where: { id: session.uid },
    include: {
      studentProfile: true,
      tutorProfile: true,
      parentProfile: { include: { students: true } },
    },
  });
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
