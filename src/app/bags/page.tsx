import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShopCatalog } from "@/components/ShopCatalog";
import type { StoreProduct } from "@/components/ProductCard";
import { requireCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bags", description: "Shop thoughtful everyday bags from Toria Accessories and Fit." };

export default async function BagsPage() {
  await requireCustomer("/bags");
  const products = await prisma.product.findMany({ where: { active: true, category: { slug: "bags" } }, include: { category: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } }) as StoreProduct[];
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">Carry a little confidence</span><h1>Bags, with purpose.</h1><p>Find a favourite for your everyday and everything in between.</p></div><ShopCatalog products={products} /></section>;
}
