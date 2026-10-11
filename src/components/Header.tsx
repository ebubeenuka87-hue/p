"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Bags", "/bags"],
  ["Sandals", "/sandals"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export function Header() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [identity, setIdentity] = useState<{ id: string; role: "CUSTOMER" | "ADMIN" } | null>(null);
  useEffect(() => {
    const update = () => {
      try {
        const items = JSON.parse(localStorage.getItem("toria-cart-v1") ?? "[]");
        setCount(Array.isArray(items) ? items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0);
      } catch {
        setCount(0);
      }
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("toria-cart-change", update);
    let active = true;
    const updateIdentity = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Account status could not be loaded.");
        if (active) setIdentity(data.user);
      } catch (error) {
        console.error("Account status could not be loaded", error);
      }
    };
    void updateIdentity();
    window.addEventListener("toria-auth-change", updateIdentity);
    return () => {
      active = false;
      window.removeEventListener("storage", update);
      window.removeEventListener("toria-cart-change", update);
      window.removeEventListener("toria-auth-change", updateIdentity);
    };
  }, []);
  return (
    <>
      <div className="announcement">Complimentary delivery on orders over ₦150,000</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Toria Accessories and Fit home">
          <span className="brand-mark">T</span>
          <span><strong>TORIA</strong><small>ACCESSORIES &amp; FIT</small></span>
        </Link>
        <nav className={open ? "main-nav is-open" : "main-nav"}>
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <div className="nav-actions">
            {identity?.role === "ADMIN"
              ? <Link href="/admin" aria-label="Administration">Admin</Link>
              : identity?.role === "CUSTOMER"
                ? <Link href="/account" aria-label="Account">Account</Link>
                : <><Link href="/login" aria-label="Sign in">Sign in</Link><Link href="/register">Create account</Link></>}
          </div>
        </nav>
        <div className="header-tools">
          {identity?.role !== "ADMIN" && <Link href="/cart" className="cart-link" aria-label={`Shopping bag, ${count} items`}>Bag <span>{count}</span></Link>}
          <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>☰</button>
        </div>
      </header>
    </>
  );
}
