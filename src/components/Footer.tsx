import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div><Link className="brand footer-brand" href="/"><span className="brand-mark">T</span><span><strong>TORIA</strong><small>ACCESSORIES &amp; FIT</small></span></Link><p>Everyday pieces, made to make you feel like yourself.</p></div>
        <div><h3>Discover</h3><Link href="/shop">Shop all</Link><Link href="/bags">Bags</Link><Link href="/sandals">Sandals</Link></div>
        <div><h3>Here to help</h3><Link href="/contact">Contact us</Link><Link href="/account/orders">Track an order</Link><Link href="/account">My account</Link></div>
        <div><h3>Stay in the know</h3><p>New drops and thoughtful things, occasionally.</p><NewsletterForm /></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Toria Accessories and Fit</span><span>Thoughtfully chosen. Made for you.</span></div>
    </footer>
  );
}
