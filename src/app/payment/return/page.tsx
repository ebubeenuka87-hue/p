import { Suspense } from "react";
import { PaymentReturn } from "@/components/PaymentReturn";
export const metadata = { title: "Payment status", robots: { index: false, follow: false } };
export default function PaymentReturnPage() { return <Suspense fallback={<section className="page-wrap">Checking your payment…</section>}><PaymentReturn /></Suspense>; }
