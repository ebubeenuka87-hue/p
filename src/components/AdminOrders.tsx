"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/money";

type Order = { id: string; orderNumber: string; fullName: string; email: string; status: string; paymentStatus: string; totalKobo: number; createdAt: string; items: { productName: string; quantity: number }[] };
const statuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export function AdminOrders({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter) params.set("status", statusFilter);
    const response = await fetch(`/api/admin/orders?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Orders could not be loaded.");
    setOrders(data.orders);
  }
  async function update(orderId: string, nextStatus: string) {
    setError("");
    const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status: nextStatus }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Order could not be updated."); return; }
    await load();
  }
  return <><h2 style={{ font: "500 27px var(--font-serif)" }}>Orders</h2><form className="shop-toolbar" onSubmit={(event) => { event.preventDefault(); void load().catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Search failed.")); }}><input aria-label="Search orders" placeholder="Search order, name or email" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter order status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="button">Search</button></form>{error && <p className="form-error">{error}</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Order / items</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong><br />{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</td><td>{order.fullName}<br />{order.email}</td><td>{order.paymentStatus}</td><td>{formatNaira(order.totalKobo)}</td><td><select aria-label={`Update ${order.orderNumber} status`} value={order.status} onChange={(event) => void update(order.id, event.target.value)}>{statuses.map((status) => <option value={status} key={status} disabled={!["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)}>{status}</option>)}</select></td><td>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(order.createdAt))}</td></tr>)}{!orders.length && <tr><td colSpan={6}>No orders match your search.</td></tr>}</tbody></table></div></>;
}
