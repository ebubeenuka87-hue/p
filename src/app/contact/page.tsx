import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Contact Toria", description: "Get in touch with Toria Accessories and Fit." };
export default function ContactPage() {
  const email = process.env.STORE_SUPPORT_EMAIL;
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">We’re here to help</span><h1>Let’s talk.</h1><p>Questions about an item, delivery, or an order? We’d love to help.</p></div><div className="summary-card" style={{ maxWidth: 600 }}><h2>Customer care</h2><p style={{ color: "var(--muted)", lineHeight: 1.8 }}>For order or product questions, reach our team by email and include your order number if you have one.</p>{email ? <a className="button" href={`mailto:${email}`}>Email {email}</a> : <p className="form-error">Customer support email has not been configured yet. Please check back soon.</p>}<p style={{ marginTop: 23 }}><Link className="text-link" href="/account/orders">View your orders</Link></p></div></section>;
}
