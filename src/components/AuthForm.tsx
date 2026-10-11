"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "forgot" | "reset";

export function AuthForm({ mode, admin = false, token = "", returnTo = "/account" }: { mode: Mode; admin?: boolean; token?: string; returnTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const endpoints = {
      login: admin ? "/api/admin/auth/login" : "/api/auth/login",
      register: "/api/auth/register",
      forgot: "/api/auth/password-reset/request",
      reset: "/api/auth/password-reset/confirm",
    } as const;
    const body = mode === "reset" ? { ...values, token } : values;
    try {
      const response = await fetch(endpoints[mode], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (mode === "register" && data.verificationPending) {
        router.push(`/verify?email=${encodeURIComponent(String(data.email ?? values.email))}&returnTo=${encodeURIComponent(returnTo)}&deliveryFailed=1`);
        return;
      }
      if (mode === "login" && data.requiresVerification) {
        router.push(`/verify?email=${encodeURIComponent(String(data.email ?? values.email))}&returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Please try again.");
      if (mode === "forgot") setMessage(data.message);
      else if (mode === "reset") {
        setMessage("Your password has been updated. You can now log in.");
        setTimeout(() => router.push(admin ? "/admin/login" : "/login"), 1400);
      } else if (mode === "register") {
        if (data.delivery?.channel === "development" && typeof data.delivery.code === "string") {
          sessionStorage.setItem("toria-dev-verification-code", data.delivery.code);
          window.dispatchEvent(new Event("toria-dev-verification-code"));
        }
        router.push(`/verify?email=${encodeURIComponent(String(data.email ?? values.email))}&returnTo=${encodeURIComponent(returnTo)}`);
      } else if (admin && data.role !== "ADMIN") {
        throw new Error("This account does not have administrator access.");
      } else {
        window.dispatchEvent(new Event("toria-auth-change"));
        router.push(admin ? "/admin" : returnTo);
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const title = mode === "register" ? "Create your account" : mode === "forgot" ? "Forgot your password?" : mode === "reset" ? "Choose a new password" : admin ? "Administrator sign in" : "Welcome back";
  return <section className="page-wrap"><div className="form-card"><span className="eyebrow">{admin ? "Toria team" : "Your Toria account"}</span><h1>{title}</h1><p>{mode === "register" ? "Join us and keep all your orders in one place. We’ll email you a verification code." : mode === "forgot" ? "Enter the email address on your account and we’ll send reset instructions." : mode === "reset" ? "Choose a strong password with at least 12 characters." : admin ? "This secure area is for authorised store administrators." : "Sign in to see your account and orders."}</p>
    <form className="form-stack" onSubmit={submit}>
      {mode === "register" && <label className="form-field">Full name<input className="field" name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>}
      {mode === "register" && <label className="form-field">Phone number<input className="field" name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={24} /></label>}
      {mode !== "reset" && <label className="form-field">Email address<input className="field" name="email" type="email" autoComplete="email" required /></label>}
      {(mode === "login" || mode === "register" || mode === "reset") && <label className="form-field">{mode === "reset" ? "New password" : "Password"}<input className="field" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 12} maxLength={128} /></label>}
      {error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}
      <button className="button" disabled={busy}>{busy ? "Please wait…" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Continue"}</button>
    </form>
    <div className="form-foot">{mode === "login" && <>{!admin && <><Link href="/forgot-password">Forgot password?</Link><br /><br />New to Toria? <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`}>Create an account</Link></>}{admin && <><Link href="/admin/forgot-password">Forgot your admin password?</Link><br /><br /><Link href="/login">Customer sign in</Link></>}</>}{mode === "register" && <>Already have an account? <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link></>}{(mode === "forgot" || mode === "reset") && <Link href={admin ? "/admin/login" : "/login"}>Back to sign in</Link>}</div>
  </div></section>;
}
