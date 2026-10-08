"use client";

import Link from "next/link";
import { addCartItem } from "@/lib/cart";
import { formatNaira } from "@/lib/money";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceKobo: number;
  stock: number;
  sample: boolean;
  imageUrls: string[];
  category: { name: string; slug: string };
};

export function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <article className="product-card">
      <Link className="product-image" href={`/product/${product.slug}`}>
        {product.imageUrls[0]
          ? <img src={product.imageUrls[0]} alt={product.name} loading="lazy" />
          : <div className="image-placeholder"><span>TORIA</span></div>}
        {product.sample && <span className="sample-tag">Sample</span>}
      </Link>
      <div className="product-info">
        <span className="eyebrow">{product.category.name}</span>
        <Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        <div className="product-bottom"><strong>{formatNaira(product.priceKobo)}</strong>
          <button aria-label={`Add ${product.name} to bag`} disabled={!product.stock} onClick={() => addCartItem(product.id)}>
            {product.stock ? "Add +" : "Sold out"}
          </button>
        </div>
      </div>
    </article>
  );
}
