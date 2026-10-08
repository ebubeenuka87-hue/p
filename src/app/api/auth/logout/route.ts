import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
