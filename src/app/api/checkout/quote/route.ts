import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireUser("CUSTOMER");
    const url = new URL(request.url);
    const entries = url.searchParams.getAll("item");
    if (!entries.length || entries.length > 30) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    const quantities = new Map<string, number>();
    for (const entry of entries) {
      const [id, rawQuantity] = entry.split(":");
      const quantity = Number(rawQuantity);
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ error: "Your bag contains an invalid quantity." }, { status: 400 });
      quantities.set(id, (quantities.get(id) ?? 0) + quantity);
    }
    const products = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true }, include: { category: { select: { name: true } } } });
    if (products.length !== quantities.size || products.some((product) => product.stock < quantities.get(product.id)!)) {
      return NextResponse.json({ error: "One or more products are unavailable in the requested quantity." }, { status: 409 });
    }
    const subtotalKobo = products.reduce((total, product) => total + product.priceKobo * quantities.get(product.id)!, 0);
    const deliveryNaira = Number(process.env.DELIVERY_FEE_NGN ?? "2500");
    if (!Number.isSafeInteger(deliveryNaira) || deliveryNaira < 0 || deliveryNaira > 21_474_836) throw new Error("DELIVERY_FEE_NGN must be a whole number within the supported payment limit.");
    const deliveryFeeKobo = subtotalKobo >= 15_000_000 ? 0 : deliveryNaira * 100;
    if (!Number.isSafeInteger(subtotalKobo) || subtotalKobo > 2_147_483_647 - deliveryFeeKobo) {
      return NextResponse.json({ error: "This order exceeds the maximum checkout amount. Please contact the store." }, { status: 409 });
    }
    return NextResponse.json({
      items: products.map((product) => ({ id: product.id, name: product.name, quantity: quantities.get(product.id), priceKobo: product.priceKobo })),
      subtotalKobo,
      deliveryFeeKobo,
      totalKobo: subtotalKobo + deliveryFeeKobo,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
