import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireUser("CUSTOMER");
    const url = new URL(request.url);
    const ids = url.searchParams.getAll("id").slice(0, 30);
    const search = url.searchParams.get("q")?.trim().slice(0, 100);
    const category = url.searchParams.get("category");
    const sort = url.searchParams.get("sort");
    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(ids.length ? { id: { in: ids } } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}),
      },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: sort === "price-asc" ? { priceKobo: "asc" } : sort === "price-desc" ? { priceKobo: "desc" } : { createdAt: "desc" },
      take: 60,
    });
    return NextResponse.json({ products });
  } catch (error) {
    return errorResponse(error);
  }
}
