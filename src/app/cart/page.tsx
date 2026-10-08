import { CartView } from "@/components/CartView";

export const metadata = { title: "Your bag" };

export default function CartPage() {
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">A good choice</span><h1>Your bag.</h1></div><CartView /></section>;
}
