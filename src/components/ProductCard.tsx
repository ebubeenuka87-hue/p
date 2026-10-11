"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function add() {
    setError("");
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Your account status could not be checked.");
      if (data.user?.role !== "CUSTOMER") {
        router.push(`/login?returnTo=${encodeURIComponent(`/product/${product.slug}`)}`);
        return;
      }
      addCartItem(product.id);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This piece could not be added to your bag.");
    }
  }
  return (
    <article className="product-card">
      <Link className="product-image" href={`/product/${product.slug}`}>
        {product.imageUrls[0]
          ? <Image src={product.imageUrls[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, 25vw" unoptimized />
          : <div className="image-placeholder"><span>TORIA</span></div>}
        {product.sample && <span className="sample-tag">Sample</span>}
      </Link>
      <div className="product-info">
        <span className="eyebrow">{product.category.name}</span>
        <Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        <div className="product-bottom"><strong>{formatNaira(product.priceKobo)}</strong>
          <button aria-label={`Add ${product.name} to bag`} disabled={!product.stock} onClick={() => void add()}>
            {product.stock ? added ? "Added ✓" : "Add +" : "Sold out"}
          </button>
        </div>
        {added && <Link className="added-bag-link" href="/cart">View bag</Link>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}
