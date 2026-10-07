import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySessionToken, type SessionPayload } from "./token";

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript → safe from XSS token theft
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // not sent on cross-site POSTs → CSRF protection for admin actions
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * The real authorization check. proxy.ts only does a fast redirect for pages;
 * every admin Server Action, route handler and page calls this, and it also
 * confirms the admin still exists in the database.
 */
export const getAdmin = cache(async () => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true },
  });
});

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
