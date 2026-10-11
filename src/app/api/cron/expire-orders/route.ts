import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { applyVerifiedPayment, verifyPaystack } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pending = await prisma.payment.findMany({
    where: { status: "PENDING", createdAt: { lt: olderThan }, order: { paymentStatus: "PENDING" } },
    select: { reference: true },
    take: 100,
    orderBy: { createdAt: "asc" },
  });
  let failed = 0;
  let stillPending = 0;
  const errors: string[] = [];
  for (const payment of pending) {
    try {
      const verified = await verifyPaystack(payment.reference);
      const status = await applyVerifiedPayment(payment.reference, verified);
      if (status === "FAILED") failed++;
      else if (status === "PENDING") stillPending++;
    } catch (error) {
      console.error("Stale payment verification failed", { reference: payment.reference, error });
      errors.push(payment.reference);
    }
  }
  return NextResponse.json({ inspected: pending.length, failed, stillPending, errors: errors.length }, { status: errors.length ? 502 : 200 });
}
