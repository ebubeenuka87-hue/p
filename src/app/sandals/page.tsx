import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShopCatalog } from "@/components/ShopCatalog";
import type { StoreProduct } from "@/components/ProductCard";
import { requireCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sandals", description: "Explore considered sandals for every day from Toria Accessories and Fit." };

export default async function SandalsPage() {
  await requireCustomer("/sandals");
  const products = await prisma.product.findMany({ where: { active: true, category: { slug: "sandals" } }, include: { category: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } }) as StoreProduct[];
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">One step at a time</span><h1>Made to move in.</h1><p>Easy, considered sandals for every version of your day.</p></div><ShopCatalog products={products} /></section>;
}
