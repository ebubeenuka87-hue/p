"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import { formatNaira } from "@/lib/money";
import type { StoreProduct } from "@/components/ProductCard";

type CartProduct = StoreProduct & { quantity: number };

export function CartView() {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const cart = readCart();
    const query = new URLSearchParams();
    cart.forEach((item) => query.append("id", item.productId));
    if (!cart.length) query.append("id", "");

    fetch(`/api/products?${query}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "We couldn't load your bag.");
        if (!active) return;
        const products = data.products as StoreProduct[];
        const retained = cart.flatMap((cartItem) => {
          const product = products.find((candidate) => candidate.id === cartItem.productId);
          if (!product || !product.stock) return [];
          return [{ productId: product.id, quantity: Math.min(cartItem.quantity, product.stock) }];
        });
        const changed = retained.length !== cart.length || retained.some((item) =>
          item.quantity !== cart.find((old) => old.productId === item.productId)?.quantity,
        );
        if (changed) {
          writeCart(retained);
          setNotice("Your bag was updated because availability changed. Please review the quantities.");
        }
        setItems(products.filter((product) => product.stock > 0).map((product) => ({
          ...product,
          quantity: retained.find((item) => item.productId === product.id)?.quantity ?? 0,
        })));
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "We couldn't load your bag.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  function update(productId: string, quantity: number) {
    const next = items
      .map((item) => item.id === productId ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0);
    setItems(next);
    const serialized: CartItem[] = next.map((item) => ({ productId: item.id, quantity: item.quantity }));
    writeCart(serialized);
  }

  const subtotal = items.reduce((sum, item) => sum + item.priceKobo * item.quantity, 0);
  if (loading) return <p>Loading your bag…</p>;
  if (error) return <div className="form-error">{error}</div>;
  if (!items.length) {
    return <div className="empty-state">
      <h2>Your bag is taking a little breather.</h2>
      <p>Let’s find something you love.</p>
      <Link className="button" href="/shop">Explore the collection</Link>
    </div>;
  }

  return <>
    {notice && <p className="form-error" role="status">{notice}</p>}
    <div className="cart-layout">
      <div>
        {items.map((item) => <article className="cart-row" key={item.id}>
          <Link className="cart-row-image" href={`/product/${item.slug}`}>
            <div className="cart-thumb">
              {item.imageUrls[0] && <Image src={item.imageUrls[0]} alt="" fill sizes="98px" unoptimized />}
            </div>
          </Link>
          <div className="cart-row-details">
            <Link href={`/product/${item.slug}`}><h3>{item.name}</h3></Link>
            <p>{item.category.name} · {formatNaira(item.priceKobo)}</p>
            <div className="cart-item-controls">
              <label className="sr-only" htmlFor={`quantity-${item.id}`}>Quantity of {item.name}</label>
              <input
                id={`quantity-${item.id}`}
                type="number"
                min={0}
                max={Math.min(20, item.stock)}
                value={item.quantity}
                onChange={(event) => update(item.id, Math.max(0, Math.min(item.stock, Number(event.target.value) || 0)))}
              />
              <button onClick={() => update(item.id, 0)}>Remove</button>
            </div>
          </div>
          <strong className="cart-row-price">{formatNaira(item.priceKobo * item.quantity)}</strong>
        </article>)}
      </div>
      <aside className="summary-card">
        <h2>Your total</h2>
        <div className="summary-line"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div>
        <div className="summary-line"><span>Delivery</span><span>Calculated at checkout</span></div>
        <div className="summary-line summary-total"><span>Total</span><span>{formatNaira(subtotal)}</span></div>
        <Link className="button" href="/checkout">Continue to checkout</Link>
        <p className="secure-note">Delivery fee confirmed at checkout. Secure payment powered by Paystack.</p>
        <Link className="text-link" href="/shop">Continue shopping</Link>
      </aside>
    </div>
  </>;
}
