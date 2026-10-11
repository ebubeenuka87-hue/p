"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Sign out failed. Please try again.");
    window.dispatchEvent(new Event("toria-auth-change"));
    router.push("/");
    router.refresh();
  }
  return <button className="text-link" type="button" onClick={() => void logout()}>Sign out</button>;
}
