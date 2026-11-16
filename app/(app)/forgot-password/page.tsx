import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="grid-surface mx-auto flex max-w-4xl flex-1 items-center px-4 py-16 md:px-6">
      <AuthForm mode="forgot" />
    </div>
  );
}
