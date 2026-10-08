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
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("toria-cart-change", update);
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
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>☰</button>
        <nav className={open ? "main-nav is-open" : "main-nav"}>
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <div className="nav-actions">
            <Link href="/account" aria-label="Account">Account</Link>
            <Link href="/cart" className="cart-link">Bag <span>{count}</span></Link>
          </div>
        </nav>
      </header>
    </>
  );
}
