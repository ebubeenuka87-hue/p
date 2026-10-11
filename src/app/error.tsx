"use client";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="page-wrap"><div className="empty-state"><span className="eyebrow">A little pause</span><h2>The store is temporarily unavailable.</h2><p>We couldn’t load this page just now. Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button></div></section>;
}
