"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations";

// A real bcrypt hash of a random string. Comparing against it when the email doesn't
// exist makes failed logins take the same time either way, so response timing can't
// reveal which admin emails exist.
const DUMMY_HASH = "$2b$12$6I.g671KheHtTUnX1Wrk5OAw1F14xJKJogVatHo6GEmT9NIU.Slke";

export type LoginState = { error?: string; email?: string };

function safeRedirectTarget(from: FormDataEntryValue | null) {
  const path = typeof from === "string" ? from : "";
  // Only allow internal admin paths: prevents open-redirects like ?from=https://evil.com
  return path.startsWith("/admin") && !path.startsWith("//") ? path : "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  const valid = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !valid) {
    return { error: "Incorrect email or password.", email }; // same message for both cases
  }

  await createSession({ adminId: admin.id, email: admin.email });
  redirect(safeRedirectTarget(formData.get("from")));
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
