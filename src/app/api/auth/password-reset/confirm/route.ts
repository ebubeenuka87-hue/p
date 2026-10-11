import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSameOrigin } from "@/lib/http";

const schema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/i), password: z.string().min(12).max(128) });

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const { token, password } = schema.parse(await request.json());
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!reset || reset.expiresAt < new Date()) {
      if (reset) await prisma.passwordResetToken.delete({ where: { id: reset.id } });
      return NextResponse.json({ error: "This password reset link is invalid or has expired. Please request a new one." }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hash(password, 12), sessionVersion: { increment: 1 } } }),
      prisma.passwordResetToken.delete({ where: { id: reset.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
