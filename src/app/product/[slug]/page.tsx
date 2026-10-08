import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { name: true, description: true, imageUrls: true, active: true } });
  if (!product?.active) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, description: product.description.slice(0, 160), images: product.imageUrls.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
  if (!product?.active) notFound();
  const related = await prisma.product.findMany({ where: { active: true, categoryId: product.categoryId, id: { not: product.id } }, include: { category: { select: { name: true, slug: true } } }, take: 4, orderBy: { createdAt: "desc" } });
  return <section className="page-wrap">
    <p className="eyebrow"><Link href="/shop">Shop</Link> / <Link href={`/${product.category.slug}`}>{product.category.name}</Link></p>
    <div className="detail-layout" style={{ marginTop: 20 }}>
      <div className="detail-image">{product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.name} /> : <div className="image-placeholder"><span>TORIA</span></div>}</div>
      <div className="detail-copy"><span className="eyebrow">{product.category.name}{product.sample ? " · Sample product" : ""}</span><h1>{product.name}</h1><p className="detail-price">{formatNaira(product.priceKobo)}</p><p className="detail-description">{product.description}</p><p className="stock-note">{product.stock > 0 ? `${product.stock} available` : "Currently out of stock"}</p><ProductActions productId={product.id} stock={product.stock} /></div>
    </div>
    {related.length > 0 && <div className="section-heading" style={{ marginTop: 75 }}><div><span className="eyebrow">You may also love</span><h2>More to discover</h2></div></div>}
    {related.length > 0 && <div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>}
  </section>;
}
