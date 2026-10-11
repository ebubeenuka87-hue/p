import { CartView } from "@/components/CartView";
import { requireCustomer } from "@/lib/customer-auth";

export const metadata = { title: "Your bag" };

export default async function CartPage() {
  await requireCustomer("/cart");
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">A good choice</span><h1>Your bag.</h1></div><CartView /></section>;
}
