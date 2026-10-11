import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { configuredSessionSecret } from "@/lib/session-secret";

const codeLifetimeMs = 10 * 60 * 1000;

export type VerificationDelivery =
  | { channel: "email" }
  | { channel: "development"; code: string };

function otpSecret() {
  const secret = configuredSessionSecret();
  if (!secret) throw new Error("Set SESSION_SECRET to at least 32 random characters before enabling accounts.");
  return secret;
}

function codeHash(code: string) {
  return createHmac("sha256", otpSecret()).update(code).digest("hex");
}

export function matchesVerificationCode(code: string, expectedHash: string) {
  const actual = Buffer.from(codeHash(code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verificationDeliveryChannel(): "email" | "development" | null {
  const smtpValues = [process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASSWORD];
  const configuredSmtpValues = smtpValues.filter(Boolean).length;
  if (configuredSmtpValues && configuredSmtpValues !== smtpValues.length) {
    throw new Error("Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD together to enable verification email.");
  }
  if (configuredSmtpValues === smtpValues.length) return "email";
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_OTP_ENABLED === "true") return "development";
  return null;
}

export async function createVerificationCode(userId: string) {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.verificationCode.upsert({
    where: { userId },
    create: { userId, codeHash: codeHash(code), expiresAt: new Date(Date.now() + codeLifetimeMs) },
    update: { codeHash: codeHash(code), attempts: 0, expiresAt: new Date(Date.now() + codeLifetimeMs), createdAt: new Date() },
  });
  return code;
}

export async function deliverVerificationCode(email: string, code: string): Promise<VerificationDelivery> {
  const channel = verificationDeliveryChannel();
  if (!channel) throw new Error("Account verification email is not configured.");
  if (channel === "development") return { channel, code };

  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT must be a valid port number.");
  const smtpUser = process.env.SMTP_USER!;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port,
    secure: port === 465,
    auth: { user: smtpUser, pass: process.env.SMTP_PASSWORD! },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? smtpUser,
    to: email,
    subject: "Verify your Toria Accessories account",
    text: `Your Toria verification code is ${code}. It expires in 10 minutes. If you did not create an account, you can ignore this email.`,
  });
  return { channel: "email" };
}
