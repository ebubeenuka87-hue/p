"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const newPassword = String(values.get("newPassword") ?? "");
    if (newPassword !== values.get("confirmPassword")) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.get("currentPassword"), newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Password could not be changed.");
      setMessage("Password changed. Please sign in again with your new password.");
      form.reset();
      window.setTimeout(() => {
        router.replace("/admin/login");
        router.refresh();
      }, 1200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password could not be changed.");
    } finally {
      setBusy(false);
    }
  }
  return <section className="form-card form-stack" style={{ maxWidth: 500, margin: 0 }}>
    <h2 style={{ font: "500 27px var(--font-serif)", margin: 0 }}>Change password</h2>
    <p>Choose a new password with at least 12 characters. Changing it signs out other sessions.</p>
    <form className="form-stack" onSubmit={submit}>
      <label className="form-field">Current password<input className="field" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></label>
      <label className="form-field">New password<input className="field" name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
      <label className="form-field">Confirm new password<input className="field" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button" disabled={busy}>{busy ? "Updating…" : "Change password"}</button>
    </form>
  </section>;
}
