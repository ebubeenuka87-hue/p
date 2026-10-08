import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [sales, orders, customers, products, pending, recent] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalKobo: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  return <><div className="admin-stats"><div className="stat-card"><span>Total sales</span><strong>{formatNaira(sales._sum.totalKobo ?? 0)}</strong></div><div className="stat-card"><span>Total orders</span><strong>{orders}</strong></div><div className="stat-card"><span>Customers</span><strong>{customers}</strong></div><div className="stat-card"><span>Products</span><strong>{products}</strong></div></div><h2 style={{ font: "500 27px var(--font-serif)" }}>Recent orders</h2>{pending > 0 && <p>{pending} pending order{pending === 1 ? "" : "s"} need attention.</p>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead><tbody>{recent.map((order) => <tr key={order.id}><td><Link href="/admin/orders">{order.orderNumber}</Link></td><td>{order.user.name}</td><td>{order.paymentStatus}</td><td>{formatNaira(order.totalKobo)}</td><td>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(order.createdAt)}</td></tr>)}{!recent.length && <tr><td colSpan={5}>Orders will appear here when customers check out.</td></tr>}</tbody></table></div></>;
}
