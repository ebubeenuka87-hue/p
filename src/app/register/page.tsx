import { AuthForm } from "@/components/AuthForm";
import { customerReturnPath } from "@/lib/return-to";
export const metadata = { title: "Create an account" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthForm mode="register" returnTo={customerReturnPath(returnTo)} />;
}
