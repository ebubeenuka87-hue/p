import { AuthForm } from "@/components/AuthForm";
import { customerReturnPath } from "@/lib/return-to";
export const metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthForm mode="login" returnTo={customerReturnPath(returnTo)} />;
}
