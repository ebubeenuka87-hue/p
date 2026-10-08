import { NextResponse } from "next/server";
import { z } from "zod";
import { applyVerifiedPayment, validPaystackSignature, verifyPaystack } from "@/lib/payments";

const eventSchema = z.object({
  event: z.string(),
  data: z.object({ reference: z.string().min(8).max(100) }).optional(),
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 1_000_000) return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000 || !validPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
  const parsed = eventSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  if (parsed.data.event !== "charge.success" && parsed.data.event !== "charge.failed") {
    return NextResponse.json({ received: true });
  }
  const reference = parsed.data.data?.reference;
  if (!reference) return NextResponse.json({ received: true });
  try {
    const verified = await verifyPaystack(reference);
    await applyVerifiedPayment(reference, verified);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
