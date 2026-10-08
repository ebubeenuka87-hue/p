import { AuthForm } from "@/components/AuthForm";
export const metadata = { title: "Administrator sign in" };
export default function AdminLoginPage() { return <AuthForm mode="login" admin />; }
