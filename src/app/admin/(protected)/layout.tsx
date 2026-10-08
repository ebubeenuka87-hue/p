import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">Toria store administration</span><h1>Good to see you.</h1><p>Signed in as {user.email}</p></div><div className="admin-layout"><nav className="admin-nav"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/customers">Customers</Link><LogoutButton /></nav><div>{children}</div></div></section>;
}
