import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    await requireSameOrigin(request);
    const user = await requireUser("CUSTOMER");
    const input = profileSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: input,
      select: { id: true, name: true, email: true, phone: true },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
