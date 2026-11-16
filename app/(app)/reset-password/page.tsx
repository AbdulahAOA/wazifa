import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { first } from "@/lib/query";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="grid-surface mx-auto flex max-w-lg flex-1 items-center px-4 py-16 md:px-6">
      <Suspense fallback={<div className="font-black">Loading…</div>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const token = first((await searchParams).token);
  if (!token) {
    return <p className="border-[3px] border-ink bg-white p-6 font-bold">This reset link is missing a token.</p>;
  }
  return <ResetPasswordForm token={token} />;
}
