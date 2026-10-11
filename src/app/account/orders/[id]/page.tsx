import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomer(`/account/orders/${encodeURIComponent(id)}`);
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: true, payment: true } });
  if (!order) notFound();
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">Order details</span><h1>{order.orderNumber}</h1><p>{new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short" }).format(order.createdAt)}</p></div>
    <div className="checkout-layout"><div><h2 style={{ font: "500 25px var(--font-serif)" }}>Items</h2>{order.items.map((item) => <div className="order-row" key={item.id}><strong>{item.productName}</strong><span>Quantity {item.quantity}</span><span>{formatNaira(item.unitPriceKobo)}</span><strong>{formatNaira(item.unitPriceKobo * item.quantity)}</strong></div>)}<h2 style={{ font: "500 25px var(--font-serif)", marginTop: 35 }}>Delivery to</h2><p>{order.fullName}<br />{order.deliveryAddress}<br />{order.city}, {order.state}<br />{order.phone}<br />{order.email}</p>{order.deliveryInformation && <p>{order.deliveryInformation}</p>}</div>
      <aside className="summary-card"><h2>Order summary</h2><div className="summary-line"><span>Order status</span><span>{order.status}</span></div><div className="summary-line"><span>Payment status</span><span>{order.paymentStatus}</span></div><div className="summary-line"><span>Subtotal</span><span>{formatNaira(order.subtotalKobo)}</span></div><div className="summary-line"><span>Delivery</span><span>{order.deliveryFeeKobo ? formatNaira(order.deliveryFeeKobo) : "Complimentary"}</span></div><div className="summary-line summary-total"><span>Total</span><span>{formatNaira(order.totalKobo)}</span></div>{order.payment && <p className="secure-note">Payment reference: {order.payment.reference}</p>}</aside></div><br /><Link className="text-link" href="/account/orders">← Back to your orders</Link></section>;
}
