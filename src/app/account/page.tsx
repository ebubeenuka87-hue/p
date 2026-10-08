import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">Your Toria</span><h1>Hello, {user.name.split(" ")[0]}.</h1><p>Your account, orders, and details all in one place.</p></div><nav className="account-nav"><Link href="/account">Profile</Link><Link href="/account/orders">Orders</Link></nav><div className="summary-card" style={{ maxWidth: 570 }}><h2>Profile details</h2><div className="summary-line"><span>Name</span><strong>{user.name}</strong></div><div className="summary-line"><span>Email</span><strong>{user.email}</strong></div><div className="summary-line"><span>Phone</span><strong>{user.phone ?? "Not added"}</strong></div><Link className="button secondary" href="/account/orders">View your orders</Link></div><div style={{ marginTop: 18 }}><LogoutButton /></div></section>;
}
