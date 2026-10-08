import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");
    const { id } = await context.params;
    const input = productSchema.parse(await request.json());
    const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
    if (!category) return NextResponse.json({ error: "Product category is not available." }, { status: 400 });
    const result = await prisma.product.updateMany({
      where: { id },
      data: {
        name: input.name, slug: input.slug, description: input.description,
        priceKobo: Math.round(input.priceNaira * 100), stock: input.stock,
        active: input.active, imageUrls: input.imageUrls, categoryId: category.id,
      },
    });
    if (!result.count) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That product URL is already in use. Please choose another." }, { status: 409 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");
    const { id } = await context.params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "This product is part of an order history and cannot be deleted. Mark it inactive instead." }, { status: 409 });
    }
    return errorResponse(error);
  }
}
