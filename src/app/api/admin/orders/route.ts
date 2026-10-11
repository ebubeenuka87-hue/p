import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser("ADMIN");
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim().slice(0, 100);
    const status = url.searchParams.get("status");
    const validStatus = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status ?? "");
    const orders = await prisma.order.findMany({
      where: {
        ...(validStatus ? { status: status as "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" } : {}),
        ...(query ? { OR: [{ orderNumber: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }, { fullName: { contains: query, mode: "insensitive" } }] } : {}),
      },
      include: { user: { select: { id: true, name: true, email: true } }, payment: { select: { reference: true, status: true, provider: true } }, items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");
    const input = z.object({ orderId: z.string().min(1), status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]) }).parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: input.orderId, }, include: { items: true } });
      if (!order) return { error: "Order not found.", status: 404 };
      if (order.paymentStatus !== "PAID" && input.status !== "CANCELLED") {
        return { error: "Only a verified paid order can move to fulfillment.", status: 409 };
      }
      const transitions: Record<string, string[]> = {
        PAID: ["PROCESSING", "CANCELLED"],
        PROCESSING: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
        PENDING: ["CANCELLED"],
      };
      if (!transitions[order.status].includes(input.status)) {
        return { error: `An order cannot move from ${order.status} to ${input.status}.`, status: 409 };
      }
      const update = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: input.status } });
      if (!update.count) return { error: "This order was updated by another administrator. Refresh and try again.", status: 409 };
      if (input.status === "CANCELLED" && order.paymentStatus !== "PAID" && !order.stockReleased) {
        const released = await tx.order.updateMany({
          where: { id: order.id, stockReleased: false, paymentStatus: { not: "PAID" } },
          data: { paymentStatus: "CANCELLED", stockReleased: true },
        });
        if (released.count) {
          for (const item of order.items) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          }
          await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "CANCELLED" } });
        }
      }
      return { ok: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
