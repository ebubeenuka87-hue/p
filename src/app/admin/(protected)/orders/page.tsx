import { AdminOrders } from "@/components/AdminOrders";
import { prisma } from "@/lib/prisma";
export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";
export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ include: { user: { select: { id: true, name: true, email: true } }, payment: { select: { reference: true, status: true, provider: true } }, items: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return <AdminOrders initialOrders={orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString() }))} />;
}
