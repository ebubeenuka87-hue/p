import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShopCatalog } from "@/components/ShopCatalog";
import type { StoreProduct } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop bags and sandals", description: "Explore the Toria Accessories collection of bags and sandals, delivered across Nigeria." };

type SearchParams = Promise<{ q?: string; sort?: string; category?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.q?.trim().slice(0, 100);
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(params.category === "bags" || params.category === "sandals" ? { category: { slug: params.category } } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}),
    },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: params.sort === "price-asc" ? { priceKobo: "asc" } : params.sort === "price-desc" ? { priceKobo: "desc" } : { createdAt: "desc" },
  }) as StoreProduct[];
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">The Toria collection</span><h1>Find your everyday favourite.</h1><p>Thoughtful accessories for the way you move through the world.</p></div>
    <form className="shop-toolbar" action="/shop"><input name="q" type="search" placeholder="Search bags and sandals" defaultValue={search} aria-label="Search products" /><select name="category" defaultValue={params.category ?? ""} aria-label="Filter by category"><option value="">All categories</option><option value="bags">Bags</option><option value="sandals">Sandals</option></select><select name="sort" defaultValue={params.sort ?? "newest"} aria-label="Sort products"><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select><button className="button" type="submit">Apply</button></form>
    <ShopCatalog products={products} /></section>;
}
