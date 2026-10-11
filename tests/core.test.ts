import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { formatNaira } from "../src/lib/money";
import { checkoutSchema, complaintSchema, emailSchema, productSchema, verificationSchema } from "../src/lib/validation";
import { validPaystackSignature } from "../src/lib/paystack-signature";
import { configuredSessionSecret } from "../src/lib/session-secret";
import { customerReturnPath } from "../src/lib/return-to";
import { supabaseProductImagePublicUrl, validateProductImage, validateSupabaseProjectUrl } from "../src/lib/product-images";

test("formats persisted kobo amounts as Nigerian naira", () => {
  assert.match(formatNaira(1_850_000), /18,500/);
  assert.match(formatNaira(0), /0/);
});

test("normalizes customer emails and rejects invalid email addresses", () => {
  assert.equal(emailSchema.parse("  PERSON@EXAMPLE.COM "), "person@example.com");
  assert.equal(emailSchema.safeParse("not-an-email").success, false);
});

test("rejects placeholder and short session-signing secrets", () => {
  process.env.SESSION_SECRET = "replace-with-at-least-32-random-bytes";
  assert.equal(configuredSessionSecret(), null);
  process.env.SESSION_SECRET = "short";
  assert.equal(configuredSessionSecret(), null);
  process.env.SESSION_SECRET = "a-real-random-secret-that-is-at-least-32-characters";
  assert.equal(configuredSessionSecret(), process.env.SESSION_SECRET);
  delete process.env.SESSION_SECRET;
});

test("checkout validation rejects empty carts and invalid quantities", () => {
  const details = {
    fullName: "A Customer",
    email: "customer@example.com",
    phone: "+2348000000000",
    address: "10 Example Street",
    city: "Lagos",
    state: "Lagos",
  };
  assert.equal(checkoutSchema.safeParse({ ...details, items: [] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...details, items: [{ productId: "product", quantity: 0 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...details, items: [{ productId: "product", quantity: 1 }] }).success, true);
});

test("customer return paths stay on the storefront and exclude admin URLs", () => {
  assert.equal(customerReturnPath("/checkout?step=delivery"), "/checkout?step=delivery");
  assert.equal(customerReturnPath("https://attacker.example"), "/account");
  assert.equal(customerReturnPath("//attacker.example"), "/account");
  assert.equal(customerReturnPath("/admin/products"), "/account");
});

test("verification and complaint schemas enforce the required input shape", () => {
  assert.equal(verificationSchema.safeParse({ email: "person@example.com", code: "012345" }).success, true);
  assert.equal(verificationSchema.safeParse({ email: "person@example.com", code: "12345" }).success, false);
  assert.equal(complaintSchema.safeParse({ name: "A Customer", email: "person@example.com", phone: "07000000000", message: "Please help with an order." }).success, true);
  assert.equal(complaintSchema.safeParse({ name: "A", email: "bad", phone: "1", message: "Hi" }).success, false);
});

test("product images are optional and accept uploaded URLs, hosted URLs, or both", () => {
  const product = {
    name: "Everyday Tote",
    slug: "everyday-tote",
    description: "A thoughtfully sized bag for everyday use.",
    priceNaira: 18500,
    stock: 4,
    active: true,
    categorySlug: "bags",
  };
  const hostedUrl = "https://images.example.com/hosted.jpg";
  const uploadedUrl = "https://cdn.example.com/products/uploaded.webp";

  assert.deepEqual(productSchema.parse(product).imageUrls, []);
  assert.deepEqual(productSchema.parse({ ...product, imageUrls: [uploadedUrl] }).imageUrls, [uploadedUrl]);
  assert.deepEqual(productSchema.parse({ ...product, imageUrls: [hostedUrl] }).imageUrls, [hostedUrl]);
  assert.deepEqual(productSchema.parse({ ...product, imageUrls: [uploadedUrl, hostedUrl] }).imageUrls, [uploadedUrl, hostedUrl]);
  assert.equal(productSchema.safeParse({ ...product, imageUrls: ["http://images.example.com/image.jpg"] }).success, false);
});

test("uploaded product images require supported file signatures and valid Supabase public URLs", () => {
  const pngHeader = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(validateProductImage(pngHeader), { ok: true, contentType: "image/png", extension: "png" });
  assert.equal(validateProductImage(Uint8Array.from([1, 2, 3])).ok, false);
  assert.equal(validateProductImage(new Uint8Array(0)).ok, false);
  assert.equal(supabaseProductImagePublicUrl("https://project.supabase.co", "product-images", "products/toria image.png"), "https://project.supabase.co/storage/v1/object/public/product-images/products/toria%20image.png");
  assert.doesNotThrow(() => validateSupabaseProjectUrl("https://project.supabase.co"));
  assert.throws(() => validateSupabaseProjectUrl("http://project.supabase.co"), /HTTPS/);
  assert.throws(() => validateSupabaseProjectUrl("https://project.supabase.co/storage"), /HTTPS URL/);
});

test("accepts only Paystack-compatible HMAC-SHA512 signatures", () => {
  const secret = "test-webhook-secret";
  const body = JSON.stringify({ event: "charge.success", data: { reference: "toria_reference" } });
  const signature = createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(validPaystackSignature(body, signature, secret), true);
  assert.equal(validPaystackSignature(body, "a".repeat(128), secret), false);
  assert.equal(validPaystackSignature(body, null, secret), false);
  assert.equal(validPaystackSignature(body, signature, undefined), false);
});
