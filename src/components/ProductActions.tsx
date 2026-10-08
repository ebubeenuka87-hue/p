"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart";

export function ProductActions({ productId, stock }: { productId: string; stock: number }) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const add = (buyNow = false) => {
    addCartItem(productId, quantity);
    if (buyNow) router.push("/checkout");
    else window.alert("Added to your bag.");
  };
  return <><div className="quantity-control"><label htmlFor="quantity">Quantity</label><input className="field" id="quantity" type="number" min={1} max={Math.min(20, stock)} value={quantity} onChange={(event) => setQuantity(Math.min(stock, Math.max(1, Number(event.target.value) || 1)))} /></div><div className="detail-buttons"><button className="button" disabled={!stock} onClick={() => add()}>Add to bag</button><button className="button secondary" disabled={!stock} onClick={() => add(true)}>Buy now</button></div></>;
}
