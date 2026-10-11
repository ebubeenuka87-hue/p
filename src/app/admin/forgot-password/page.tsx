import { AuthForm } from "@/components/AuthForm";
export const metadata = { title: "Reset administrator password" };
export default function AdminForgotPasswordPage() { return <AuthForm mode="forgot" admin />; }
