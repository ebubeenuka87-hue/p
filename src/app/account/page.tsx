import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AccountProfileForm } from "@/components/AccountProfileForm";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireCustomer("/account");
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">Your Toria</span><h1>Hello, {user.name.split(" ")[0]}.</h1><p>Your account, orders, and details all in one place.</p></div><nav className="account-nav"><Link href="/account">Profile</Link><Link href="/account/orders">Orders</Link></nav><AccountProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} /><div style={{ marginTop: 18 }}><LogoutButton /></div></section>;
}
