"use client";

export type CartItem = { productId: string; quantity: number };
const cartKey = "toria-cart-v1";

export function readCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cartKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem =>
      typeof item?.productId === "string" &&
      Number.isInteger(item?.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 20
    );
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(cartKey, JSON.stringify(items));
  window.dispatchEvent(new Event("toria-cart-change"));
}

export function addCartItem(productId: string, quantity = 1) {
  const items = readCart();
  const existing = items.find((item) => item.productId === productId);
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else items.push({ productId, quantity });
  writeCart(items);
}
