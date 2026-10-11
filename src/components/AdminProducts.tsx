"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { formatNaira } from "@/lib/money";

type Product = { id: string; name: string; slug: string; description: string; priceKobo: number; stock: number; active: boolean; imageUrls: string[]; category: { slug: string; name: string } };
type Draft = { name: string; slug: string; description: string; priceNaira: string; stock: string; active: boolean; categorySlug: string; imageUrls: string };
const blank: Draft = { name: "", slug: "", description: "", priceNaira: "", stock: "0", active: true, categorySlug: "bags", imageUrls: "" };

export function AdminProducts({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  async function load() {
    const response = await fetch("/api/admin/products");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Products could not be loaded.");
    setProducts(data.products);
  }
  function edit(product: Product) {
    setEditing(product.id);
    setDraft({ name: product.name, slug: product.slug, description: product.description, priceNaira: String(product.priceKobo / 100), stock: String(product.stock), active: product.active, categorySlug: product.category.slug, imageUrls: product.imageUrls.join("\n") });
    setError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const body = { ...draft, priceNaira: Number(draft.priceNaira), stock: Number(draft.stock), imageUrls: draft.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean) };
      const response = await fetch(editing ? `/api/admin/products/${editing}` : "/api/admin/products", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Product could not be saved.");
      await load();
      setDraft(blank);
      setEditing("");
      setSuccess("Product saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Product could not be saved."); }
    finally { setBusy(false); }
  }
  async function upload(files: File[]) {
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const existing = draft.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
      if (existing.length + files.length > 8) {
        throw new Error("A product can have up to 8 images. Remove an image URL or choose fewer files.");
      }
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/images/upload", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Image upload failed.");
        if (typeof data.publicUrl !== "string") throw new Error("The image was uploaded but no public URL was returned.");
        setDraft((current) => ({ ...current, imageUrls: [current.imageUrls.trim(), data.publicUrl].filter(Boolean).join("\n") }));
      }
      setSuccess(`${files.length} image${files.length === 1 ? "" : "s"} uploaded. Save the product to keep them.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Image upload failed."); }
    finally { setUploading(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this product? Products in order history cannot be deleted.")) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Product could not be deleted.");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Product could not be deleted."); }
  }
  return <><h2 style={{ font: "500 27px var(--font-serif)" }}>Manage products</h2><form className="form-card form-stack" style={{ maxWidth: "none", margin: "0 0 30px" }} onSubmit={submit}>
    <h3 style={{ font: "500 22px var(--font-serif)", margin: 0 }}>{editing ? "Edit product" : "Add a product"}</h3>
    <div className="admin-form-grid"><label className="form-field">Product name<input className="field" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required minLength={2} maxLength={160} /></label><label className="form-field">URL slug<input className="field" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="everyday-tote" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label className="form-field">Price in NGN<input className="field" type="number" min="1" max="20000000" step="0.01" value={draft.priceNaira} onChange={(event) => setDraft({ ...draft, priceNaira: event.target.value })} required /></label><label className="form-field">Available quantity<input className="field" type="number" min="0" max="100000" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} required /></label><label className="form-field">Category<select className="field" value={draft.categorySlug} onChange={(event) => setDraft({ ...draft, categorySlug: event.target.value })}><option value="bags">Bags</option><option value="sandals">Sandals</option></select></label><label className="form-field">Visibility<select className="field" value={String(draft.active)} onChange={(event) => setDraft({ ...draft, active: event.target.value === "true" })}><option value="true">Active</option><option value="false">Inactive</option></select></label></div>
    <label className="form-field">Description<textarea className="field" rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required minLength={10} maxLength={5000} /></label>
    <label className="form-field">Image URLs (optional, one HTTPS URL per line)<textarea className="field" rows={3} disabled={busy || uploading} value={draft.imageUrls} onChange={(event) => setDraft({ ...draft, imageUrls: event.target.value })} placeholder="Add hosted HTTPS image URLs, or upload images below. You may leave this empty." /></label>
    {draft.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).length > 0 && <div className="admin-image-previews" aria-label="Product image previews">{draft.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).map((url) => <Image key={url} src={url} alt="Product image preview" width={96} height={96} unoptimized />)}</div>}
    <label className="form-field">Upload from your computer (JPEG, PNG, WebP or AVIF, up to 8 MB each)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy || uploading} onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; if (files.length) void upload(files); }} /></label>
    {uploading && <p role="status">Uploading image to cloud storage…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}<div style={{ display: "flex", gap: 10 }}><button className="button" disabled={busy || uploading}>{busy ? "Saving…" : uploading ? "Uploading…" : editing ? "Save changes" : "Create product"}</button>{editing && <button type="button" className="button secondary" disabled={busy || uploading} onClick={() => { setEditing(""); setDraft(blank); }}>Cancel edit</button>}</div>
  </form><div className="table-scroll"><table className="data-table"><thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.imageUrls[0] ? <Image className="admin-product-thumbnail" src={product.imageUrls[0]} alt="" width={56} height={56} unoptimized /> : <span className="admin-no-image">No image</span>}</td><td>{product.name}</td><td>{product.category.name}</td><td>{formatNaira(product.priceKobo)}</td><td>{product.stock}</td><td>{product.active ? "Active" : "Inactive"}</td><td><button className="text-link" onClick={() => edit(product)}>Edit</button> <button className="text-link" onClick={() => void remove(product.id)}>Delete</button></td></tr>)}</tbody></table></div></>;
}
