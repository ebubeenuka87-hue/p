import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

const windowMs = 15 * 60 * 1000;
const maximumFailures = 5;

function emailKey(email: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(email).digest("hex");
}

export async function loginIsLocked(email: string) {
  const attempt = await prisma.loginAttempt.findUnique({ where: { key: emailKey(email) } });
  return Boolean(attempt?.lockedUntil && attempt.lockedUntil > new Date());
}

export async function recordFailedLogin(email: string) {
  const key = emailKey(email);
  const now = new Date();
  const previous = await prisma.loginAttempt.findUnique({ where: { key } });
  const resetWindow = !previous || now.getTime() - previous.updatedAt.getTime() >= windowMs || Boolean(previous.lockedUntil);
  const attempt = await prisma.loginAttempt.upsert({
    where: { key },
    create: { key, failures: 1 },
    update: resetWindow ? { failures: 1, lockedUntil: null } : { failures: { increment: 1 }, lockedUntil: null },
  });
  if (attempt.failures >= maximumFailures) {
    await prisma.loginAttempt.update({ where: { key }, data: { lockedUntil: new Date(now.getTime() + windowMs) } });
    return true;
  }
  return false;
}

export async function clearLoginFailures(email: string) {
  await prisma.loginAttempt.deleteMany({ where: { key: emailKey(email) } });
}
