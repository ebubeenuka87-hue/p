import { AdminCustomers } from "@/components/AdminCustomers";
import { prisma } from "@/lib/prisma";
export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";
export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return <AdminCustomers initialCustomers={customers.map((customer) => ({ ...customer, createdAt: customer.createdAt.toISOString() }))} />;
}
