import { AuthForm } from "@/components/AuthForm";
export const metadata = { title: "Reset administrator password" };
export default async function AdminResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthForm mode="reset" admin token={token ?? ""} />;
}
