import { randomUUID } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";

const schema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  size: z.number().int().positive().max(8 * 1024 * 1024),
});

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");
    const { contentType } = schema.parse(await request.json());
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;
    const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!region || !bucket || !publicBase || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: "Product image storage is not configured. Configure the S3 storage settings first." }, { status: 503 });
    }
    const ext = contentType.split("/")[1];
    const key = `products/${randomUUID()}.${ext}`;
    const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const signed = await createPresignedPost(client, {
      Bucket: bucket,
      Key: key,
      Expires: 600,
      Fields: { "Content-Type": contentType },
      Conditions: [["content-length-range", 1, 8 * 1024 * 1024], ["eq", "$Content-Type", contentType]],
    });
    return NextResponse.json({ url: signed.url, fields: signed.fields, publicUrl: `${publicBase}/${key}`, key });
  } catch (error) {
    return errorResponse(error);
  }
}
