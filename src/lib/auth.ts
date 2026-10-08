import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const cookieName = "toria_session";

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: { id: string; role: UserRole }) {
  const token = await new SignJWT({ role: user.role })
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
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    if (!payload.sub || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")) return null;
    subject = payload.sub;
  } catch {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: subject },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });
}

export async function requireUser(role?: UserRole) {
  const user = await currentUser();
  if (!user) throw new Error("AUTH:Unauthorized");
  if (role && user.role !== role) throw new Error("AUTH:Forbidden");
  return user;
}
