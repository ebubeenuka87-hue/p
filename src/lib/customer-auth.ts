import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export async function requireCustomer(returnTo: string) {
  const user = await currentUser();
  if (!user || user.role !== "CUSTOMER") {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return user;
}
