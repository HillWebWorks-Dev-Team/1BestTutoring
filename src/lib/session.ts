import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { live } from "./live";

export type SessionPayload = {
  uid: string;
  role: string;
  name: string;
  email: string;
};

const COOKIE = "opb_session";

function secret() {
  const value = process.env.AUTH_SECRET || "local-dev-secret-change-before-deploy-1percent";
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function readSession(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return {
    uid: String(payload.uid),
    role: String(payload.role),
    name: String(payload.name),
    email: String(payload.email),
  } satisfies SessionPayload;
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

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
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
