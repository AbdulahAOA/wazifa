"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, signInAction, signUpAction, type ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

type Mode = "sign-in" | "sign-up" | "forgot";
const initial: ActionState = {};

export function AuthForm({ mode, next = "", notice = "" }: { mode: Mode; next?: string; notice?: string }) {
  const action = mode === "sign-in" ? signInAction : mode === "sign-up" ? signUpAction : forgotPasswordAction;
  const [state, formAction] = useActionState(action, initial);
  const title = mode === "sign-in" ? "SIGN IN." : mode === "sign-up" ? "CREATE AN ACCOUNT." : "RESET PASSWORD.";

  const copy =
    mode === "forgot"
      ? "Enter the email on your account. The response is the same whether or not that address is registered. Email is not sent unless a delivery provider is configured."
      : "New accounts are candidates. Operator access is granted in the database, not by the email address.";

  return (
    <div className="grid w-full overflow-hidden border-[3px] border-ink bg-white hard-shadow md:grid-cols-[0.9fr_1.1fr]">
      <div className="bg-ink p-6 text-white md:p-8">
        <Link
          href="/"
          className="inline-block border-[3px] border-white bg-electric px-2 py-1 text-lg font-black text-ink"
        >
          WAZIFA
        </Link>
        <h2 className="mt-6 text-4xl leading-[0.95] font-black">Hard edges. Clear access.</h2>
        <p className="mt-4 text-sm leading-6 text-white/75">{copy}</p>
      </div>
      <form action={formAction} className="grid gap-4 p-6 md:p-8">
      <h1 className="text-4xl font-black tracking-tight">{title}</h1>
      {notice ? <p className="border-[3px] border-ink bg-electric px-3 py-2 font-bold">{notice}</p> : null}
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      {state.message ? <p className="border-[3px] border-ink bg-electric px-3 py-2 font-bold">{state.message}</p> : null}
      {mode !== "forgot" ? <input type="hidden" name="next" value={next} /> : null}
      {mode === "sign-up" ? (
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {mode !== "forgot" ? (
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </div>
      ) : null}
      <SubmitButton variant="cobalt" size="lg" pendingLabel="Working…">
        {mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Create reset token"}
      </SubmitButton>
      <div className="flex flex-wrap gap-3 text-sm font-extrabold uppercase tracking-widest">
        {mode !== "sign-in" ? <Link href="/sign-in">Sign in</Link> : null}
        {mode !== "sign-up" ? <Link href="/sign-up">Sign up</Link> : null}
        {mode !== "forgot" ? <Link href="/forgot-password">Forgot password</Link> : null}
      </div>
      </form>
    </div>
  );
}
