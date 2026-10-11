import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { emailSchema, verificationSchema } from "@/lib/validation";
import { createVerificationCode, deliverVerificationCode, matchesVerificationCode, verificationDeliveryChannel } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const input = verificationSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, role: true, sessionVersion: true, emailVerifiedAt: true },
    });
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "This verification code is invalid or has expired." }, { status: 400 });
    }
    if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

    const outcome = await prisma.$transaction(async (tx) => {
      const challenge = await tx.verificationCode.findUnique({ where: { userId: user.id } });
      if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
        return { verified: false };
      }
      if (!matchesVerificationCode(input.code, challenge.codeHash)) {
        await tx.verificationCode.updateMany({
          where: { id: challenge.id, attempts: { lt: 5 } },
          data: { attempts: { increment: 1 } },
        });
        return { verified: false };
      }
      const updated = await tx.user.updateMany({
        where: { id: user.id, emailVerifiedAt: null },
        data: { emailVerifiedAt: new Date() },
      });
      await tx.verificationCode.deleteMany({ where: { userId: user.id } });
      return { verified: updated.count === 1 };
    });
    if (!outcome.verified) {
      return NextResponse.json({ error: "This verification code is invalid or has expired. Request a new code and try again." }, { status: 400 });
    }
    await createSession(user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireSameOrigin(request);
    const { email } = z.object({ email: emailSchema }).parse(await request.json());
    const channel = verificationDeliveryChannel();
    if (!channel) {
      return NextResponse.json({ error: "Email verification is not configured. Please contact the store." }, { status: 503 });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, emailVerifiedAt: true },
    });
    if (!user || user.role !== "CUSTOMER" || user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, message: "If an unverified account exists, a new code will be sent." });
    }
    const existing = await prisma.verificationCode.findUnique({ where: { userId: user.id } });
    if (existing && Date.now() - existing.createdAt.getTime() < 60_000) {
      return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });
    }
    const code = await createVerificationCode(user.id);
    let delivery;
    try {
      delivery = await deliverVerificationCode(user.email, code);
    } catch (error) {
      await prisma.verificationCode.deleteMany({ where: { userId: user.id } });
      console.error("Customer verification email could not be delivered", error);
      return NextResponse.json({ error: "The verification email could not be delivered. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, message: "A new verification code has been sent.", delivery });
  } catch (error) {
    return errorResponse(error);
  }
}
