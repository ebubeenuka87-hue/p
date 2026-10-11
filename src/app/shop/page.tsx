import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShopCatalog } from "@/components/ShopCatalog";
import type { StoreProduct } from "@/components/ProductCard";
import { requireCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop bags and sandals", description: "Explore the Toria Accessories collection of bags and sandals, delivered across Nigeria." };

type SearchParams = Promise<{ q?: string; sort?: string; category?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  await requireCustomer("/shop");
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
  return <section className="page-wrap shop-page"><div className="page-heading"><span className="eyebrow">The Toria collection</span><h1>Find your everyday favourite.</h1><p>Thoughtful accessories for the way you move through the world.</p></div>
    <form className="shop-toolbar" action="/shop">
      <label className="shop-search">
        <span>Search the collection</span>
        <span className="shop-search-field"><span className="shop-search-icon" aria-hidden="true" /><input name="q" type="search" placeholder="Try “everyday bag”" defaultValue={search} /></span>
      </label>
      <label className="shop-filter">
        <span>Category</span>
        <select name="category" defaultValue={params.category ?? ""} aria-label="Filter by category"><option value="">All categories</option><option value="bags">Bags</option><option value="sandals">Sandals</option></select>
      </label>
      <label className="shop-filter">
        <span>Sort by</span>
        <select name="sort" defaultValue={params.sort ?? "newest"} aria-label="Sort products"><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select>
      </label>
      <button className="button shop-apply" type="submit">Show results</button>
    </form>
    <p className="shop-result-count" aria-live="polite">{products.length} {products.length === 1 ? "piece" : "pieces"}{search ? ` matching “${search}”` : " in the collection"}</p>
    <ShopCatalog products={products} /></section>;
}
