"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { writeCart } from "@/lib/cart";

type Result = { status: string; error?: string; orderNumber?: string };

export function PaymentReturn() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const [result, setResult] = useState<Result | null>(null);
  async function verify() {
    if (!reference) { setResult({ status: "INVALID", error: "We couldn't find a payment reference." }); return; }
    setResult({ status: "CHECKING" });
    try {
      const response = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We couldn't verify your payment.");
      setResult(data);
      if (data.status === "PAID") {
        writeCart([]);
        localStorage.removeItem("toria-checkout-key");
      }
    } catch (error) {
      setResult({ status: "ERROR", error: error instanceof Error ? error.message : "Payment verification is temporarily unavailable." });
    }
  }
  useEffect(() => { void verify(); }, [reference]);
  return <section className="page-wrap"><div className="form-card" style={{ textAlign: "center" }}><span className="eyebrow">Payment update</span><h1 style={{ font: "500 35px var(--font-serif)" }}>{result?.status === "PAID" ? "Thank you." : result?.status === "FAILED" || result?.status === "CANCELLED" ? "Payment not completed." : "Checking your payment…"}</h1>
    {result?.status === "PAID" ? <><p>Your payment has been verified securely. Your order is confirmed and we’ll be in touch with delivery updates.</p><Link className="button" href="/account/orders">View your orders</Link></> : result?.status === "PENDING" || result?.status === "CHECKING" ? <p>We’re checking directly with Paystack. Please don’t make another payment while this is in progress.</p> : <><p>{result?.error ?? "The payment was not completed. You can review your order or return to your bag."}</p>{result?.status === "ERROR" && <button className="button secondary" onClick={() => void verify()}>Check again</button>}<br /><br /><Link className="button" href="/account/orders">View orders</Link></>}
  </div></section>;
}
