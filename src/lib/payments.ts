import "server-only";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validPaystackSignature as verifySignature } from "@/lib/paystack-signature";

type PaystackVerification = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    gateway_response?: string;
  };
};

export async function verifyPaystack(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_")) throw new Error("Paystack is not configured.");
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as PaystackVerification;
  if (!response.ok || !result.status || !result.data) throw new Error("Paystack could not verify this transaction.");
  return result.data;
}

export async function applyVerifiedPayment(reference: string, data: PaystackVerification["data"]) {
  const payment = await prisma.payment.findUnique({ where: { reference }, include: { order: { include: { items: true } } } });
  if (!payment || !data || data.reference !== reference) return "NOT_FOUND" as const;
  const successful = data.status === "success" &&
    data.amount === payment.amountKobo &&
    data.currency === "NGN" &&
    payment.order.totalKobo === payment.amountKobo;

  if (successful) {
    let needsReview = false;
    await prisma.$transaction(async (tx) => {
      const latestOrder = await tx.order.findUnique({ where: { id: payment.orderId }, select: { status: true, stockReleased: true } });
      if (!latestOrder) return;
      needsReview = latestOrder.status === "CANCELLED" || latestOrder.stockReleased;
      const claimed = await tx.payment.updateMany({ where: { id: payment.id, status: { not: "PAID" } }, data: {
        status: "PAID",
        paidAt: data.paid_at && Number.isFinite(Date.parse(data.paid_at)) ? new Date(data.paid_at) : new Date(),
        gatewayResponse: { status: data.status, amount: data.amount, currency: data.currency, gatewayResponse: data.gateway_response ?? null },
      } });
      if (claimed.count) {
        await tx.order.update({ where: { id: payment.orderId }, data: {
          paymentStatus: "PAID",
          ...(latestOrder.status === "PENDING" && !latestOrder.stockReleased ? { status: "PAID" } : {}),
        } });
      }
    });
    const latest = await prisma.payment.findUnique({ where: { reference }, select: { status: true } });
    if (latest?.status === "PAID" && needsReview) return "REVIEW" as const;
    return latest?.status === "PAID" ? "PAID" as const : "NOT_PAID" as const;
  }

  if (data.status === "failed" || data.status === "abandoned") {
    await releaseReservedOrder(payment.orderId, "FAILED");
    return "FAILED" as const;
  }
  return "PENDING" as const;
}

export async function releaseReservedOrder(orderId: string, paymentStatus: Extract<PaymentStatus, "FAILED" | "CANCELLED">) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;
    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockReleased: false, paymentStatus: { not: "PAID" } },
      data: { status: "CANCELLED", paymentStatus, stockReleased: true },
    });
    if (!claimed.count) return;
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: paymentStatus } });
  });
}

export function validPaystackSignature(rawBody: string, signature: string | null) {
  return verifySignature(rawBody, signature, process.env.PAYSTACK_SECRET_KEY);
}

export type PaymentTransaction = Prisma.TransactionClient;
