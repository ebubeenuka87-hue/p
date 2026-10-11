import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { configuredSessionSecret } from "@/lib/session-secret";

const cookieName = "toria_session";

function sessionKey() {
  const secret = configuredSessionSecret();
  if (!secret) throw new Error("Set SESSION_SECRET to at least 32 random characters before enabling accounts.");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: { id: string; role: UserRole; sessionVersion: number }) {
  const token = await new SignJWT({ role: user.role, version: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionKey());
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  let subject: string | undefined;
  let version: number | undefined;
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    if (!payload.sub || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN") || typeof payload.version !== "number" || !Number.isInteger(payload.version)) return null;
    subject = payload.sub;
    version = payload.version;
  } catch {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: subject },
    select: { id: true, name: true, email: true, phone: true, role: true, sessionVersion: true, emailVerifiedAt: true },
  });
  if (!user || user.sessionVersion !== version || (user.role === "CUSTOMER" && !user.emailVerifiedAt)) return null;
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

export async function requireUser(role?: UserRole) {
  const user = await currentUser();
  if (!user) throw new Error("AUTH:Unauthorized");
  if (role && user.role !== role) throw new Error("AUTH:Forbidden");
  return user;
}
