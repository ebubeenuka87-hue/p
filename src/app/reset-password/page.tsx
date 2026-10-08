import { AuthForm } from "@/components/AuthForm";
export const metadata = { title: "Choose a new password" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthForm mode="reset" token={token ?? ""} />;
}
