import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { configuredSessionSecret } from "@/lib/session-secret";
import { createVerificationCode, deliverVerificationCode, verificationDeliveryChannel } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const input = registerSchema.parse(await request.json());
    if (!configuredSessionSecret()) return NextResponse.json({ error: "Account creation is not configured yet. Please contact the store." }, { status: 503 });
    const deliveryChannel = verificationDeliveryChannel();
    if (!deliveryChannel) {
      return NextResponse.json({ error: "Email verification is not configured. Please contact the store before creating an account." }, { status: 503 });
    }
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await hash(input.password, 12),
        role: "CUSTOMER",
      },
      select: { id: true, email: true },
    });
    const code = await createVerificationCode(user.id);
    let delivery;
    try {
      delivery = await deliverVerificationCode(user.email, code);
    } catch (error) {
      await prisma.verificationCode.deleteMany({ where: { userId: user.id } });
      console.error("Customer verification email could not be delivered", error);
      return NextResponse.json({
        error: "Your account was created, but the verification email could not be delivered. Continue to verification and request another code.",
        email: user.email,
        verificationPending: true,
      }, { status: 503 });
    }
    return NextResponse.json({ ok: true, email: user.email, delivery }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists. If it is not verified, continue to email verification and request a new code." }, { status: 409 });
    }
    return errorResponse(error);
  }
}
