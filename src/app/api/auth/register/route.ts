import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const input = registerSchema.parse(await request.json());
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET must contain at least 32 characters.");
    }
    const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await hash(input.password, 12),
      },
      select: { id: true, role: true },
    });
    await createSession(user);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
