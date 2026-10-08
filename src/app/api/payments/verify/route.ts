import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { applyVerifiedPayment, verifyPaystack } from "@/lib/payments";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const user = await requireUser();
    const { reference } = z.object({ reference: z.string().min(8).max(100) }).parse(await request.json());
    const payment = await prisma.payment.findUnique({ where: { reference }, include: { order: { select: { userId: true } } } });
    if (!payment || (payment.order.userId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    if (payment.status === "PAID") return NextResponse.json({ status: "PAID" });
    if (payment.status === "FAILED" || payment.status === "CANCELLED") return NextResponse.json({ status: payment.status });
    const verified = await verifyPaystack(reference);
    const status = await applyVerifiedPayment(reference, verified);
    return NextResponse.json({ status });
  } catch (error) {
    return errorResponse(error);
  }
}
