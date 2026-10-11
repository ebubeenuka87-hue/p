"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { writeCart } from "@/lib/cart";

type Result = { status: string; error?: string; orderNumber?: string };

async function verifyReference(reference: string): Promise<Result> {
  const response = await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "We couldn't verify your payment.");
  return data as Result;
}

export function PaymentReturn() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    let active = true;
    if (!reference) {
      Promise.resolve().then(() => {
        if (active) setResult({ status: "INVALID", error: "We couldn't find a payment reference." });
      });
      return () => { active = false; };
    }
    verifyReference(reference).then((data) => {
      if (!active) return;
      setResult(data);
      if (data.status === "PAID") {
        writeCart([]);
        localStorage.removeItem("toria-checkout-key");
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        localStorage.removeItem("toria-checkout-key");
      }
    }).catch((error: unknown) => {
      if (active) setResult({ status: "ERROR", error: error instanceof Error ? error.message : "Payment verification is temporarily unavailable." });
    });
    return () => { active = false; };
  }, [reference]);

  async function verifyAgain() {
    if (!reference) return;
    setResult({ status: "CHECKING" });
    try {
      const data = await verifyReference(reference);
      setResult(data);
      if (data.status === "PAID") {
        writeCart([]);
        localStorage.removeItem("toria-checkout-key");
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        localStorage.removeItem("toria-checkout-key");
      }
    } catch (error) {
      setResult({ status: "ERROR", error: error instanceof Error ? error.message : "Payment verification is temporarily unavailable." });
    }
  }
  return <section className="page-wrap"><div className="form-card" style={{ textAlign: "center" }}><span className="eyebrow">Payment update</span><h1 style={{ font: "500 35px var(--font-serif)" }}>{result?.status === "PAID" ? "Thank you." : result?.status === "REVIEW" ? "We’re reviewing your order." : result?.status === "FAILED" || result?.status === "CANCELLED" ? "Payment not completed." : "Checking your payment…"}</h1>
    {result?.status === "PAID" ? <><p>Your payment has been verified securely. Your order is confirmed and we’ll be in touch with delivery updates.</p><Link className="button" href="/account/orders">View your orders</Link></> : result?.status === "REVIEW" ? <><p>Paystack confirms your payment, but we need to review the order before confirming delivery. Please contact customer care and quote your payment reference.</p><Link className="button" href="/contact">Contact Toria</Link></> : result?.status === "PENDING" || result?.status === "CHECKING" ? <><p>We’re checking directly with Paystack. Please don’t make another payment while this is in progress.</p>{result?.status === "PENDING" && <button className="button secondary" onClick={() => void verifyAgain()}>Check again</button>}</> : <><p>{result?.error ?? "The payment was not completed. You can review your order or return to your bag."}</p>{result?.status === "ERROR" && reference && <button className="button secondary" onClick={() => void verifyAgain()}>Check again</button>}<br /><br /><Link className="button" href="/account/orders">View orders</Link></>}
  </div></section>;
}
