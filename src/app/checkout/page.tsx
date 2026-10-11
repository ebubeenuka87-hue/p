import { requireCustomer } from "@/lib/customer-auth";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Secure checkout" };

export default async function CheckoutPage() {
  const user = await requireCustomer("/checkout");
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">Almost yours</span><h1>Secure checkout.</h1></div><CheckoutForm customer={{ name: user.name, email: user.email, phone: user.phone }} /></section>;
}
