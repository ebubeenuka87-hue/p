import { VerificationForm } from "@/components/VerificationForm";
import { customerReturnPath } from "@/lib/return-to";

export const metadata = { title: "Verify your email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; returnTo?: string; deliveryFailed?: string }> }) {
  const { email, returnTo, deliveryFailed } = await searchParams;
  return <VerificationForm email={email ?? ""} returnTo={customerReturnPath(returnTo)} deliveryFailed={deliveryFailed === "1"} />;
}
