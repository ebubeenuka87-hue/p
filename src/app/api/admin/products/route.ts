import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireUser("ADMIN");
    const products = await prisma.product.findMany({ include: { category: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ products });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");
    const input = productSchema.parse(await request.json());
    const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
    if (!category) return NextResponse.json({ error: "Product category is not available." }, { status: 400 });
    const product = await prisma.product.create({
      data: {
        name: input.name, slug: input.slug, description: input.description,
        priceKobo: Math.round(input.priceNaira * 100), stock: input.stock,
        active: input.active, imageUrls: input.imageUrls, categoryId: category.id,
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That product URL is already in use. Please choose another." }, { status: 409 });
    }
    return errorResponse(error);
  }
}
