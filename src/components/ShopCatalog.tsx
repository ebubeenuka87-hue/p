import { ProductCard, type StoreProduct } from "@/components/ProductCard";

export function ShopCatalog({ products }: { products: StoreProduct[] }) {
  return products.length
    ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    : <div className="empty-state"><h2>No pieces found</h2><p>Try another search, or check back soon for new arrivals.</p></div>;
}
