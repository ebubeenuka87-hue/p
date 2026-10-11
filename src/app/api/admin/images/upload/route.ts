import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { supabaseProductImagePublicUrl, validateProductImage, validateSupabaseProjectUrl } from "@/lib/product-images";

const maximumRequestBytes = 9 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maximumRequestBytes) {
      return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
    if (!supabaseUrl || !serviceRoleKey || !bucket) {
      return NextResponse.json({ error: "Product image storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET on the server." }, { status: 503 });
    }

    validateSupabaseProjectUrl(supabaseUrl);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = validateProductImage(bytes);
    if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 });

    const key = `products/${randomUUID()}.${image.extension}`;
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      });
      const { error } = await supabase.storage.from(bucket).upload(key, bytes, {
        contentType: image.contentType,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        console.error("Supabase Storage upload failed:", error.message);
        return NextResponse.json({ error: "Cloud image upload failed. Check the Supabase project URL, bucket name, bucket permissions, and server-side secret key." }, { status: 502 });
      }
    } catch (error) {
      console.error("Supabase Storage upload request failed", error);
      return NextResponse.json({ error: "Could not connect to Supabase Storage. Check the project URL and try again." }, { status: 502 });
    }

    return NextResponse.json({ publicUrl: supabaseProductImagePublicUrl(supabaseUrl, bucket, key) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
