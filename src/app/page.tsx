import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/NewsletterForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { active: true, stock: { gt: 0 } },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return (
    <>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">The everyday, elevated</span><h1>Style that completes you.</h1><p>Considered bags and sandals for wherever the day takes you. Made for your moments, and every version of you.</p><Link className="button" href="/shop">Shop the collection</Link></div>
        <div className="hero-image" role="img" aria-label="A considered selection of everyday fashion accessories" />
      </section>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">A few favourites</span><h2>Pieces to keep close</h2></div><Link className="text-link" href="/shop">Explore all pieces</Link></div>
        {products.length ? <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>A new collection is on its way</h2><p>There are no products available just yet. Please check back soon.</p></div>}
      </section>
      <section className="category-feature">
        <Link className="category-tile bags" href="/bags"><div><span>Carry a little confidence</span><h2>Bags, with purpose</h2><span>Explore bags&nbsp; →</span></div></Link>
        <Link className="category-tile sandals" href="/sandals"><div><span>One step at a time</span><h2>Made to move in</h2><span>Explore sandals&nbsp; →</span></div></Link>
      </section>
      {products.length > 4 && <section className="section"><div className="section-heading"><div><span className="eyebrow">Just arrived</span><h2>New to Toria</h2></div><Link className="text-link" href="/shop">See what's new</Link></div><div className="product-grid">{products.slice(4, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
      <section className="benefits"><div className="benefit"><h3>Thoughtful quality</h3><p>Well-chosen details and styles you will reach for again and again.</p></div><div className="benefit"><h3>Delivery across Nigeria</h3><p>From our door to yours, wherever home happens to be.</p></div><div className="benefit"><h3>Here when you need us</h3><p>Real people, ready to help you find the right fit.</p></div></section>
      <section className="story"><div className="story-image" role="img" aria-label="A relaxed, timeless style" /><div className="story-copy"><span className="eyebrow">A little about us</span><h2>Style should feel like you.</h2><p>We believe getting dressed is one of the small ways we show up for ourselves. Toria brings together thoughtful accessories that add something special to the everyday, without asking you to be anyone but yourself.</p><Link className="text-link" href="/about">Get to know Toria</Link></div></section>
      <section className="quote-section"><span className="eyebrow">In their words</span><blockquote>We’ll share real customer stories here, only with permission.</blockquote><p>Thoughtful words from the Toria community</p></section>
      <section className="newsletter"><span className="eyebrow">A note from us</span><h2>Good things, occasionally.</h2><p>New pieces, thoughtful edits, and a little inspiration for your everyday.</p><NewsletterForm /></section>
    </>
  );
}
