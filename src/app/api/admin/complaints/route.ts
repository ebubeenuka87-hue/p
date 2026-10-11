import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { errorResponse, requireSameOrigin } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { complaintStatusSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireUser("ADMIN");
    const complaints = await prisma.complaint.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ complaints });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSameOrigin(request);
    await requireUser("ADMIN");
    const input = z.object({ complaintId: z.string().min(1), status: complaintStatusSchema }).parse(await request.json());
    const update = await prisma.complaint.updateMany({
      where: { id: input.complaintId },
      data: { status: input.status },
    });
    if (!update.count) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
