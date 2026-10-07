import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm bg-white p-8 sm:p-10">
        <Link href="/" className="block text-center font-display text-xl tracking-[var(--tracking-logo)]">
          THREADLINE
        </Link>
        <p className="label mb-8 mt-2 text-center text-muted">Admin</p>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
