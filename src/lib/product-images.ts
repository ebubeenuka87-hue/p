const maxImageSize = 8 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": { extension: "jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  "image/webp": { extension: "webp", matches: (bytes: Uint8Array) => bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP" },
  "image/avif": { extension: "avif", matches: (bytes: Uint8Array) => bytes.length >= 12 && String.fromCharCode(...bytes.subarray(4, 12)).includes("ftypavif") },
} satisfies Record<string, { extension: string; matches: (bytes: Uint8Array) => boolean }>;

export function productImageType(bytes: Uint8Array) {
  for (const [contentType, definition] of Object.entries(imageTypes)) {
    if (definition.matches(bytes)) return { contentType, extension: definition.extension };
  }
  return null;
}

export function validateProductImage(bytes: Uint8Array) {
  if (bytes.byteLength === 0) return { ok: false as const, error: "The selected image is empty." };
  if (bytes.byteLength > maxImageSize) return { ok: false as const, error: "Images must be 8 MB or smaller." };
  const type = productImageType(bytes);
  if (!type) return { ok: false as const, error: "Choose a valid JPEG, PNG, WebP, or AVIF image." };
  return { ok: true as const, ...type };
}

export function validateProductImageHeader(bytes: Uint8Array, declaredContentType: string) {
  const type = productImageType(bytes);
  if (!type || type.contentType !== declaredContentType) {
    return { ok: false as const, error: "Choose a valid JPEG, PNG, WebP, or AVIF image." };
  }
  return { ok: true as const, ...type };
}

export function supabaseProductImagePublicUrl(projectUrl: string, bucket: string, key: string) {
  const url = new URL(projectUrl);
  return `${url.origin}/storage/v1/object/public/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function validateSupabaseProjectUrl(projectUrl: string) {
  const url = new URL(projectUrl);
  const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((!isLocalHttp && url.protocol !== "https:") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SUPABASE_URL must be a project HTTPS URL without credentials, path, query, or fragment.");
  }
}
