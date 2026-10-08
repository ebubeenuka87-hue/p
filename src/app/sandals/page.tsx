import { prisma } from "@/lib/prisma";
import { ShopCatalog } from "@/components/ShopCatalog";
import type { StoreProduct } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SandalsPage() {
  const products = await prisma.product.findMany({ where: { active: true, category: { slug: "sandals" } }, include: { category: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } }) as StoreProduct[];
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">One step at a time</span><h1>Made to move in.</h1><p>Easy, considered sandals for every version of your day.</p></div><ShopCatalog products={products} /></section>;
}
