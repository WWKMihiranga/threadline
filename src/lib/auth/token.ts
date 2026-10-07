import { SignJWT, jwtVerify } from "jose";

// Signed (HS256) session token for the admin panel.
// Kept free of Next.js APIs so both proxy.ts and server code can use it.

export const SESSION_COOKIE = "tl_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = { adminId: string; email: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.adminId !== "string" || typeof payload.email !== "string") return null;
    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null; // expired, tampered or malformed
  }
}
