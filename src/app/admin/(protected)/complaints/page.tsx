import { AdminComplaints } from "@/components/AdminComplaints";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Customer complaints" };
export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage() {
  const complaints = await prisma.complaint.findMany({
    select: { id: true, name: true, email: true, phone: true, message: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return <AdminComplaints initialComplaints={complaints.map((complaint) => ({ ...complaint, createdAt: complaint.createdAt.toISOString() }))} />;
}
