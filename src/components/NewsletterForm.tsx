"use client";

import { useState, type FormEvent } from "react";
import { useId } from "react";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    setError("");
    setBusy(true);
    const email = new FormData(form).get("email");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Please try again.");
      setMessage(data.message);
      form.reset();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Subscription failed."); }
    finally { setBusy(false); }
  }
  return <><form className="newsletter-form" onSubmit={submit}><label className="sr-only" htmlFor={inputId}>Email address</label><input id={inputId} name="email" type="email" placeholder="Your email address" required /><button type="submit" aria-label="Subscribe" disabled={busy}>→</button></form>{(message || error) && <p role={error ? "alert" : "status"} className={error ? "form-error" : "form-success"}>{message || error}</p>}</>;
}
