import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser("ADMIN");
    const url = new URL(request.url);
    const customerId = url.searchParams.get("id");
    if (customerId) {
      const customer = await prisma.user.findUnique({
        where: { id: customerId, role: "CUSTOMER" },
        select: { id: true, name: true, email: true, phone: true, createdAt: true, orders: { include: { payment: true, items: true }, orderBy: { createdAt: "desc" } } },
      });
      if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      return NextResponse.json({ customer });
    }
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ customers });
  } catch (error) {
    return errorResponse(error);
  }
}
