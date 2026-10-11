"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";

function subscribeToDevelopmentCode(onChange: () => void) {
  window.addEventListener("toria-dev-verification-code", onChange);
  return () => window.removeEventListener("toria-dev-verification-code", onChange);
}

function getDevelopmentCode() {
  return sessionStorage.getItem("toria-dev-verification-code") ?? "";
}

function getServerDevelopmentCode() {
  return "";
}

export function VerificationForm({ email: initialEmail, returnTo, deliveryFailed = false }: { email: string; returnTo: string; deliveryFailed?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const developmentCode = useSyncExternalStore(subscribeToDevelopmentCode, getDevelopmentCode, getServerDevelopmentCode);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(deliveryFailed ? "Your account exists, but no verification email was delivered. Check your email address and try requesting a new code." : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const update = () => window.dispatchEvent(new Event("toria-dev-verification-code"));
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We couldn't verify your email.");
      setMessage("Your email is verified. Taking you to your account…");
      sessionStorage.removeItem("toria-dev-verification-code");
      window.dispatchEvent(new Event("toria-auth-change"));
      router.replace(returnTo);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't verify your email.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "A new code could not be sent.");
      if (data.delivery?.channel === "development" && typeof data.delivery.code === "string") {
        sessionStorage.setItem("toria-dev-verification-code", data.delivery.code);
        window.dispatchEvent(new Event("toria-dev-verification-code"));
      }
      setMessage(data.message ?? "A new verification code has been sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A new code could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="page-wrap"><div className="form-card">
    <span className="eyebrow">One more step</span>
    <h1>Verify your email.</h1>
    <p>Enter the six-digit code sent to your email address. The code expires in 10 minutes.</p>
    <form className="form-stack" onSubmit={submit}>
      <label className="form-field">Account email address<input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="form-field">Verification code<input className="field" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
      {developmentCode && <p className="form-success" role="status">Development verification code: <strong>{developmentCode}</strong></p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button" disabled={busy}>{busy ? "Please wait…" : "Verify email"}</button>
    </form>
    <div className="form-foot"><button className="text-link" type="button" disabled={busy || !email} onClick={() => void resend()}>Resend verification code</button></div>
  </div></section>;
}
