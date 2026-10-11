import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "About Toria", description: "Discover the thinking behind Toria Accessories and Fit." };
export default function AboutPage() {
  return <section className="page-wrap"><div className="story about-story"><div className="story-image" role="img" aria-label="A considered everyday wardrobe" /><div className="story-copy"><span className="eyebrow">Our point of view</span><h2>Style should feel like you.</h2><p>Toria Accessories and Fit is a Nigerian accessories store focused on bags and sandals that make everyday dressing feel a little more considered.</p><p>We believe the pieces you reach for most should feel good to wear, easy to live with, and entirely your own.</p><Link className="button" href="/shop">Explore the collection</Link></div></div></section>;
}
