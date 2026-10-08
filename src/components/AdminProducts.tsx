"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatNaira } from "@/lib/money";

type Product = { id: string; name: string; slug: string; description: string; priceKobo: number; stock: number; active: boolean; imageUrls: string[]; category: { slug: string; name: string } };
type Draft = { name: string; slug: string; description: string; priceNaira: string; stock: string; active: boolean; categorySlug: string; imageUrls: string };
const blank: Draft = { name: "", slug: "", description: "", priceNaira: "", stock: "0", active: true, categorySlug: "bags", imageUrls: "" };

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/admin/products");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Products could not be loaded.");
    setProducts(data.products);
  }
  useEffect(() => { void load().catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Products could not be loaded.")); }, []);
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
      const body = { ...draft, priceNaira: Number(draft.priceNaira), stock: Number(draft.stock), imageUrls: draft.imageUrls.split(/\s+/).filter(Boolean) };
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
  async function upload(file: File) {
    setError("");
    try {
      const response = await fetch("/api/admin/images/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: file.type, size: file.size }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Image upload could not be prepared.");
      const form = new FormData();
      Object.entries(data.fields as Record<string, string>).forEach(([key, value]) => form.append(key, value));
      form.append("file", file);
      const uploadResponse = await fetch(data.url, { method: "POST", body: form });
      if (!uploadResponse.ok) throw new Error("Image upload failed. Please check your storage bucket configuration.");
      setDraft((current) => ({ ...current, imageUrls: [current.imageUrls, data.publicUrl].filter(Boolean).join("\n") }));
      setSuccess("Image uploaded.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Image upload failed."); }
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
    <label className="form-field">Image URLs (one per line)<textarea className="field" rows={3} value={draft.imageUrls} onChange={(event) => setDraft({ ...draft, imageUrls: event.target.value })} placeholder="Use the image uploader below or paste HTTPS image URLs." /></label>
    <label className="form-field">Upload an image (JPEG, PNG, WebP or AVIF, up to 8MB)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success}</p>}<div style={{ display: "flex", gap: 10 }}><button className="button" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create product"}</button>{editing && <button type="button" className="button secondary" onClick={() => { setEditing(""); setDraft(blank); }}>Cancel edit</button>}</div>
  </form><div className="table-scroll"><table className="data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.category.name}</td><td>{formatNaira(product.priceKobo)}</td><td>{product.stock}</td><td>{product.active ? "Active" : "Inactive"}</td><td><button className="text-link" onClick={() => edit(product)}>Edit</button> <button className="text-link" onClick={() => void remove(product.id)}>Delete</button></td></tr>)}</tbody></table></div></>;
}
