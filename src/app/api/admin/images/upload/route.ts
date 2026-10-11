import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { supabaseProductImagePublicUrl, validateProductImageHeader, validateSupabaseProjectUrl } from "@/lib/product-images";

const signRequestSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  size: z.number().int().positive(),
  headerBytes: z.array(z.number().int().min(0).max(255)).min(3).max(16),
});

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
    if (!supabaseUrl || !serviceRoleKey || !bucket) {
      return NextResponse.json({ error: "Product image storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET on the server." }, { status: 503 });
    }

    validateSupabaseProjectUrl(supabaseUrl);
    const input = signRequestSchema.parse(await request.json());
    if (input.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
    }
    const image = validateProductImageHeader(Uint8Array.from(input.headerBytes), input.contentType);
    if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 });

    const key = `products/${randomUUID()}.${image.extension}`;
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      });
      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key, { upsert: false });
      if (error) {
        console.error("Supabase Storage signed upload URL creation failed:", error.message);
        return NextResponse.json({ error: "Could not prepare a secure image upload. Check the Supabase project URL, bucket name, and server-side secret key." }, { status: 502 });
      }
      return NextResponse.json({
        token: data.token,
        path: data.path,
        bucket,
        publicUrl: supabaseProductImagePublicUrl(supabaseUrl, bucket, key),
      }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("Supabase Storage signed upload URL request failed", error);
      return NextResponse.json({ error: "Could not connect to Supabase Storage. Check the project URL and try again." }, { status: 502 });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
