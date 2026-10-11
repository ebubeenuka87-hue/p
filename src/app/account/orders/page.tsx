import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your orders" };

export default async function AccountOrdersPage() {
  const user = await requireCustomer("/account/orders");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, include: { payment: { select: { status: true } } }, orderBy: { createdAt: "desc" } });
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">The important details</span><h1>Your orders.</h1></div><nav className="account-nav"><Link href="/account">Profile</Link><Link href="/account/orders">Orders</Link></nav>
    {orders.length ? orders.map((order) => <Link className="order-row" href={`/account/orders/${order.id}`} key={order.id}><strong>{order.orderNumber}</strong><span>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(order.createdAt)}</span><span className={`status-pill ${order.status === "DELIVERED" ? "paid" : ""}`}>{order.status}</span><strong>{formatNaira(order.totalKobo)}</strong></Link>) : <div className="empty-state"><h2>No orders just yet.</h2><p>Your next favourite is waiting to be found.</p><Link className="button" href="/shop">Explore the collection</Link></div>}
  </section>;
}
