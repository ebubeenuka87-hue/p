import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { complaintSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireSameOrigin(request);
    const input = complaintSchema.parse(await request.json());
    const customer = await currentUser();
    const complaint = await prisma.complaint.create({
      data: {
        ...input,
        userId: customer?.role === "CUSTOMER" ? customer.id : undefined,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, complaintId: complaint.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
