import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { emailSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const { email } = z.object({ email: emailSchema }).parse(await request.json());
    try {
      await prisma.newsletterSubscriber.create({ data: { email } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
    return NextResponse.json({ message: "Thank you for joining our list." });
  } catch (error) {
    return errorResponse(error);
  }
}
