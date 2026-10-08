import { timingSafeEqual, createHmac } from "node:crypto";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: {
        status: "PAID",
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        gatewayResponse: { status: data.status, amount: data.amount, currency: data.currency, gatewayResponse: data.gateway_response ?? null },
      } });
      if (claimed.count) {
        await tx.order.updateMany({ where: { id: payment.orderId, status: "PENDING" }, data: { status: "PAID", paymentStatus: "PAID" } });
      }
    });
    const latest = await prisma.payment.findUnique({ where: { reference }, select: { status: true } });
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
    if (!order || order.stockReleased || order.paymentStatus === "PAID") return;
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", paymentStatus, stockReleased: true } });
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: paymentStatus } });
  });
}

export function validPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type PaymentTransaction = Prisma.TransactionClient;
