"use client";

import { useState, type FormEvent } from "react";

export function AccountProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Your profile could not be updated.");
      setSuccess("Your profile has been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your profile could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form-card form-stack profile-form" onSubmit={submit}>
    <h2>Profile details</h2>
    <label className="form-field">Full name<input className="field" name="name" autoComplete="name" defaultValue={name} required minLength={2} maxLength={100} /></label>
    <label className="form-field">Email address<input className="field" type="email" value={email} readOnly /></label>
    <p className="secure-note">Email addresses cannot be changed here because they are used to verify and secure your account.</p>
    <label className="form-field">Phone number<input className="field" name="phone" type="tel" autoComplete="tel" defaultValue={phone} required minLength={7} maxLength={24} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {success && <p className="form-success" role="status">{success}</p>}
    <button className="button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
  </form>;
}
