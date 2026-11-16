import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { first } from "@/lib/query";

export const metadata = { title: "Sign up" };

export default function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="grid-surface mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-16 md:px-6">
      <Suspense fallback={<div className="font-black">Loading…</div>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <AuthForm mode="sign-up" next={first(params.next)} />;
}
