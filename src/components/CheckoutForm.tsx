"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { readCart, writeCart } from "@/lib/cart";
import { formatNaira } from "@/lib/money";

type Quote = { items: { id: string; name: string; quantity: number; priceKobo: number }[]; subtotalKobo: number; deliveryFeeKobo: number; totalKobo: number };

export function CheckoutForm({ customer }: { customer: { name: string; email: string; phone: string | null } }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const cart = readCart();
    if (!cart.length) { setError("Your bag is empty. Add something lovely before checking out."); return; }
    const query = new URLSearchParams();
    cart.forEach((item) => query.append("item", `${item.productId}:${item.quantity}`));
    fetch(`/api/checkout/quote?${query}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We couldn't confirm your bag.");
      setQuote(data);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "We couldn't confirm your bag."));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const cart = readCart();
    if (!cart.length) { setBusy(false); setError("Your bag is empty."); return; }
    let key = localStorage.getItem("toria-checkout-key");
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem("toria-checkout-key", key);
    }
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(event.currentTarget).entries()), items: cart }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Checkout could not be started.");
      if (typeof data.authorizationUrl !== "string" || !data.authorizationUrl.startsWith("https://checkout.paystack.com/")) {
        throw new Error("Paystack returned an invalid checkout address. Please contact the store before retrying.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't start checkout.");
      setBusy(false);
    }
  }
  if (error && !quote) return <div><div className="form-error" role="alert">{error}</div><br /><Link className="button secondary" href="/cart">Return to bag</Link></div>;
  return <div className="checkout-layout"><form className="form-card form-stack" style={{ maxWidth: "none", margin: 0 }} onSubmit={submit}><h2 style={{ fontFamily: "var(--font-serif)", fontSize: 27, fontWeight: 500, margin: 0 }}>Delivery information</h2>
    <label className="form-field">Full name<input className="field" name="fullName" autoComplete="name" defaultValue={customer.name} required minLength={2} maxLength={100} /></label>
    <label className="form-field">Email address<input className="field" name="email" type="email" autoComplete="email" defaultValue={customer.email} required /></label>
    <label className="form-field">Phone number<input className="field" name="phone" type="tel" autoComplete="tel" defaultValue={customer.phone ?? ""} required minLength={7} maxLength={24} /></label>
    <label className="form-field">Delivery address<textarea className="field" name="address" autoComplete="street-address" rows={3} required minLength={5} maxLength={300} /></label>
    <label className="form-field">City<input className="field" name="city" autoComplete="address-level2" required minLength={2} maxLength={100} /></label>
    <label className="form-field">State<input className="field" name="state" autoComplete="address-level1" required minLength={2} maxLength={100} /></label>
    <label className="form-field">Additional delivery information <span style={{ color: "var(--muted)" }}>(optional)</span><textarea className="field" name="deliveryInformation" rows={2} maxLength={500} /></label>
    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="button" disabled={busy || !quote}>{busy ? "Connecting to Paystack…" : "Continue to secure payment"}</button>
    <p className="secure-note">You’ll be securely redirected to Paystack. Payment methods depend on your Paystack merchant account.</p>
  </form><aside className="summary-card"><h2>Order summary</h2>{quote ? <><div className="checkout-items">{quote.items.map((item) => <p key={item.id}><span>{item.name} × {item.quantity}</span><strong>{formatNaira(item.priceKobo * item.quantity)}</strong></p>)}</div><div className="summary-line"><span>Subtotal</span><span>{formatNaira(quote.subtotalKobo)}</span></div><div className="summary-line"><span>Delivery</span><span>{quote.deliveryFeeKobo ? formatNaira(quote.deliveryFeeKobo) : "Complimentary"}</span></div><div className="summary-line summary-total"><span>Total</span><span>{formatNaira(quote.totalKobo)}</span></div></> : <p>Loading your secure order summary…</p>}</aside></div>;
}
