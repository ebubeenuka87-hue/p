"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import { formatNaira } from "@/lib/money";
import type { StoreProduct } from "@/components/ProductCard";

type CartProduct = StoreProduct & { quantity: number };

export function CartView() {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const current = readCart();
    if (!current.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const query = new URLSearchParams();
      current.forEach((item) => query.append("id", item.productId));
      const response = await fetch(`/api/products?${query}`);
      if (!response.ok) throw new Error("We couldn't load your bag. Please refresh and try again.");
      const data = await response.json();
      setItems((data.products as StoreProduct[]).map((product) => ({ ...product, quantity: current.find((item) => item.productId === product.id)?.quantity ?? 0 })));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't load your bag.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const update = (productId: string, quantity: number) => {
    const next = items.map((item) => item.id === productId ? { ...item, quantity } : item).filter((item) => item.quantity > 0);
    setItems(next);
    const serialized: CartItem[] = next.map((item) => ({ productId: item.id, quantity: item.quantity }));
    writeCart(serialized);
  };
  const subtotal = items.reduce((sum, item) => sum + item.priceKobo * item.quantity, 0);
  if (loading) return <p>Loading your bag…</p>;
  if (error) return <div className="form-error">{error}</div>;
  if (!items.length) return <div className="empty-state"><h2>Your bag is taking a little breather.</h2><p>Let’s find something you love.</p><Link className="button" href="/shop">Explore the collection</Link></div>;
  return <div className="cart-layout"><div>{items.map((item) => <article className="cart-row" key={item.id}><Link href={`/product/${item.slug}`}><div className="cart-thumb">{item.imageUrls[0] && <img src={item.imageUrls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div></Link><div><Link href={`/product/${item.slug}`}><h3>{item.name}</h3></Link><p>{item.category.name} · {formatNaira(item.priceKobo)}</p><label className="sr-only" htmlFor={`quantity-${item.id}`}>Quantity of {item.name}</label><input id={`quantity-${item.id}`} type="number" min={0} max={Math.min(20, item.stock)} value={item.quantity} onChange={(event) => update(item.id, Math.max(0, Math.min(item.stock, Number(event.target.value) || 0)))} /><button onClick={() => update(item.id, 0)}>Remove</button></div><strong>{formatNaira(item.priceKobo * item.quantity)}</strong></article>)}</div><aside className="summary-card"><h2>Your total</h2><div className="summary-line"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div><div className="summary-line"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-line summary-total"><span>Total</span><span>{formatNaira(subtotal)}</span></div><Link className="button" href="/checkout">Continue to checkout</Link><p className="secure-note">Delivery fee confirmed at checkout. Secure payment powered by Paystack.</p><Link className="text-link" href="/shop">Continue shopping</Link></aside></div>;
}
