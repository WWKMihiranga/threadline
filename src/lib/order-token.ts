import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Order confirmation pages show a customer's name and address, so they must not be
// reachable just by guessing an order id. Each link carries an HMAC of the order id
// signed with AUTH_SECRET; without the secret a valid link can't be forged.
// No extra database column is needed.

function sign(orderId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`order:${orderId}`).digest("base64url").slice(0, 32);
}

export function orderAccessToken(orderId: string) {
  return sign(orderId);
}

export function verifyOrderAccessToken(orderId: string, token: string | undefined | null) {
  if (!token) return false;
  const expected = Buffer.from(sign(orderId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function orderPagePath(orderId: string) {
  return `/order/${orderId}?t=${orderAccessToken(orderId)}`;
}
