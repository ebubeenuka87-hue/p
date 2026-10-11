import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Please check the information provided." },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message.startsWith("AUTH:")) {
    const message = error.message.slice(5);
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }

  console.error("Request failed", error);
  return NextResponse.json({ error: "We couldn't complete that request. Please try again." }, { status: 500 });
}

export async function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    throw new Error("AUTH:Unauthorized");
  }
}
