"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/money";

type Customer = { id: string; name: string; email: string; phone: string | null; createdAt: string; _count?: { orders: number }; orders?: { id: string; orderNumber: string; status: string; paymentStatus: string; totalKobo: number }[] };

export function AdminCustomers({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  async function show(id: string) {
    const response = await fetch(`/api/admin/customers?id=${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Customer details could not be loaded."); return; }
    setSelected(data.customer);
  }
  return <><h2 style={{ font: "500 27px var(--font-serif)" }}>Customers</h2>{error && <p className="form-error">{error}</p>}{selected && <div className="summary-card" style={{ marginBottom: 25 }}><button className="text-link" onClick={() => setSelected(null)}>← All customers</button><h3 style={{ font: "500 23px var(--font-serif)" }}>{selected.name}</h3><p>{selected.email} · {selected.phone ?? "No phone number"}</p><h4>Orders</h4>{selected.orders?.map((order) => <div className="summary-line" key={order.id}><span>{order.orderNumber} · {order.status} · {order.paymentStatus}</span><strong>{formatNaira(order.totalKobo)}</strong></div>)}</div>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Joined</th><th /></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.email}</td><td>{customer.phone ?? "—"}</td><td>{customer._count?.orders ?? 0}</td><td>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(customer.createdAt))}</td><td><button className="text-link" onClick={() => void show(customer.id)}>View</button></td></tr>)}{!customers.length && <tr><td colSpan={6}>Customer accounts will appear here once created.</td></tr>}</tbody></table></div></>;
}
