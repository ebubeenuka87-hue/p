import { AdminProducts } from "@/components/AdminProducts";
import { prisma } from "@/lib/prisma";
export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";
export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ include: { category: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } });
  return <AdminProducts initialProducts={products} />;
}
