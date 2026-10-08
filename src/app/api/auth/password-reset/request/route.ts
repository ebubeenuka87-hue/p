import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validation";
import { errorResponse, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const { email } = z.object({ email: emailSchema }).parse(await request.json());
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpHost || !smtpUser || !smtpPassword) {
      return NextResponse.json({ error: "Password reset email is not configured yet. Please contact the store for help." }, { status: 503 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? "587"),
        secure: Number(process.env.SMTP_PORT ?? "587") === 465,
        auth: { user: smtpUser, pass: smtpPassword },
      });
      const url = new URL("/reset-password", process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin);
      url.searchParams.set("token", token);
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? smtpUser,
        to: user.email,
        subject: "Reset your Toria account password",
        text: `Use this link to reset your password. It expires in 30 minutes: ${url.toString()}`,
      });
    }
    return NextResponse.json({ message: "If an account exists for that email, password reset instructions have been sent." });
  } catch (error) {
    return errorResponse(error);
  }
}
