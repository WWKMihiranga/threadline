"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { login, type LoginState } from "./actions";

export function LoginForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="from" value={from ?? "/admin"} />
      {state.error && (
        <p role="alert" className="border border-sale/40 bg-sale/5 px-4 py-3 text-[14px] text-sale">
          {state.error}
        </p>
      )}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </Button>
    </form>
  );
}
