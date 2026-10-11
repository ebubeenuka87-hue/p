"use client";

import { useState, type FormEvent } from "react";

type ContactDetails = { name: string; email: string; phone: string };

export function ContactForm({ initialDetails }: { initialDetails: ContactDetails }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Your message could not be sent.");
      form.reset();
      setSuccess("Thank you. Your message has been sent to our customer-care team.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form-card form-stack contact-form" onSubmit={submit}>
    <h2>Send us a message</h2>
    <label className="form-field">Your name<input className="field" name="name" autoComplete="name" defaultValue={initialDetails.name} required minLength={2} maxLength={100} /></label>
    <label className="form-field">Email address<input className="field" name="email" type="email" autoComplete="email" defaultValue={initialDetails.email} required maxLength={254} /></label>
    <label className="form-field">Phone number<input className="field" name="phone" type="tel" autoComplete="tel" defaultValue={initialDetails.phone} required minLength={7} maxLength={24} /></label>
    <label className="form-field">How can we help?<textarea className="field" name="message" rows={5} required minLength={10} maxLength={5000} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {success && <p className="form-success" role="status">{success}</p>}
    <button className="button" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
  </form>;
}
