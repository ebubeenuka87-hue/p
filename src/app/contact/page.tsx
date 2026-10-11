import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { currentUser } from "@/lib/auth";
import { supportContacts, whatsappUrl } from "@/lib/support";

export const metadata: Metadata = { title: "Contact Toria", description: "Get in touch with Toria Accessories and Fit." };

export default async function ContactPage() {
  const user = await currentUser();
  const contacts = supportContacts();
  const whatsapp = whatsappUrl(contacts.whatsapp);
  return <section className="page-wrap">
    <div className="page-heading"><span className="eyebrow">We’re here to help</span><h1>Let’s talk.</h1><p>Questions about a piece, an order, or delivery? Reach Toria through any of these support channels.</p></div>
    <div className="support-grid">
      <div className="summary-card support-card"><h2>Phone</h2>{contacts.phone ? <a href={`tel:${contacts.phone}`}>{contacts.phone}</a> : <p>Phone support is not configured yet.</p>}</div>
      <div className="summary-card support-card"><h2>Email</h2>{contacts.email ? <a href={`mailto:${contacts.email}`}>{contacts.email}</a> : <p>Email support is not configured yet.</p>}</div>
      <div className="summary-card support-card"><h2>WhatsApp</h2>{whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer">Chat with us on WhatsApp</a> : <p>WhatsApp support is not configured yet.</p>}</div>
    </div>
    <div className="contact-layout">
      <ContactForm initialDetails={{ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" }} />
      <aside className="summary-card contact-note"><h2>Customer care</h2><p>Tell us how we can help and our team will follow up using the details you provide. For order questions, include your order number in your message.</p></aside>
    </div>
  </section>;
}
