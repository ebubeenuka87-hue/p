import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { checkoutSchema } from "@/lib/validation";

class StockError extends Error {}

function paystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_")) throw new Error("Paystack is not configured.");
  return secret;
}

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const user = await requireUser("CUSTOMER");
    const input = checkoutSchema.parse(await request.json());
    const checkoutKey = request.headers.get("idempotency-key");
    if (!checkoutKey || !/^[\w-]{16,100}$/.test(checkoutKey)) {
      return NextResponse.json({ error: "Please refresh checkout and try again." }, { status: 400 });
    }
    const existing = await prisma.order.findUnique({ where: { checkoutKey }, include: { payment: true } });
    if (existing) {
      if (existing.userId !== user.id || !existing.payment) return NextResponse.json({ error: "Unable to resume checkout." }, { status: 409 });
      if (existing.payment.authorizationUrl && existing.payment.status === "PENDING") return NextResponse.json({ authorizationUrl: existing.payment.authorizationUrl });
      return NextResponse.json({ error: "This checkout has already been processed. Please review your orders." }, { status: 409 });
    }

    const quantities = new Map<string, number>();
    for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    if ([...quantities.values()].some((quantity) => quantity > 20)) {
      return NextResponse.json({ error: "Please reduce the quantity of one or more items." }, { status: 400 });
    }
    const deliveryNaira = Number(process.env.DELIVERY_FEE_NGN ?? "2500");
    if (!Number.isSafeInteger(deliveryNaira) || deliveryNaira < 0) throw new Error("DELIVERY_FEE_NGN must be a whole number.");
    const orderNumber = `TOR-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const reference = `toria_${randomUUID().replaceAll("-", "")}`;
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
      if (products.length !== quantities.size) throw new StockError("One or more items in your bag are no longer available.");
      const subtotalKobo = products.reduce((sum, product) => {
        const quantity = quantities.get(product.id)!;
        if (product.stock < quantity) throw new StockError(`${product.name} does not have enough stock available.`);
        return sum + product.priceKobo * quantity;
      }, 0);
      if (!Number.isSafeInteger(subtotalKobo) || subtotalKobo > 2_147_483_647 - deliveryNaira * 100) {
        throw new StockError("This order exceeds the maximum checkout amount. Please contact the store.");
      }
      for (const product of products) {
        const quantity = quantities.get(product.id)!;
        const updated = await tx.product.updateMany({
          where: { id: product.id, active: true, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count !== 1) throw new StockError(`${product.name} has just sold out. Please update your bag.`);
      }
      const deliveryFeeKobo = subtotalKobo >= 15_000_000 ? 0 : deliveryNaira * 100;
      const order = await tx.order.create({
        data: {
          orderNumber, checkoutKey, userId: user.id,
          fullName: input.fullName, email: input.email, phone: input.phone,
          deliveryAddress: input.address, city: input.city, state: input.state,
          deliveryInformation: input.deliveryInformation,
          subtotalKobo, deliveryFeeKobo, totalKobo: subtotalKobo + deliveryFeeKobo,
          items: { create: products.map((product) => ({
            productId: product.id, productName: product.name,
            unitPriceKobo: product.priceKobo, quantity: quantities.get(product.id)!,
          })) },
        },
      });
      await tx.address.create({ data: {
        userId: user.id, fullName: input.fullName, email: input.email, phone: input.phone,
        address: input.address, city: input.city, state: input.state,
        deliveryInformation: input.deliveryInformation,
      } });
      await tx.payment.create({ data: { orderId: order.id, reference, amountKobo: order.totalKobo } });
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    let paystackResponse: Response;
    try {
      paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${paystackSecret()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: input.email,
          amount: result.totalKobo,
          currency: "NGN",
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/payment/return`,
          metadata: { order_id: result.id, order_number: orderNumber },
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      await releaseOrder(result.id, "FAILED");
      return NextResponse.json({ error: "We couldn't connect to Paystack. Your items have been returned to stock; please try again." }, { status: 502 });
    }
    const gateway = await paystackResponse.json().catch(() => null) as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } } | null;
    const authorizationUrl = gateway?.data?.authorization_url;
    if (!paystackResponse.ok || !gateway?.status || !authorizationUrl || gateway.data?.reference !== reference) {
      await releaseOrder(result.id, "FAILED");
      console.error("Paystack initialization rejected", { status: paystackResponse.status, message: gateway?.message });
      return NextResponse.json({ error: "We couldn't start your payment. Your items have been returned to stock; please try again." }, { status: 502 });
    }
    await prisma.payment.update({ where: { reference }, data: { authorizationUrl } });
    return NextResponse.json({ authorizationUrl });
  } catch (error) {
    if (error instanceof StockError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof StockError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Stock just changed. Please refresh your bag and try again." }, { status: 409 });
    }
    return errorResponse(error);
  }
}

async function releaseOrder(orderId: string, paymentStatus: "FAILED" | "CANCELLED") {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.stockReleased) return;
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", paymentStatus, stockReleased: true } });
    await tx.payment.update({ where: { orderId }, data: { status: paymentStatus } });
  });
}
