import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser("CUSTOMER");
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { payment: { select: { reference: true, status: true, provider: true, paidAt: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error);
  }
}
