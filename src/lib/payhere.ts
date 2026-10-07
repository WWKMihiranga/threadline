import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// PayHere Checkout API helpers.
// The merchant secret only ever lives on the server: the browser receives a
// ready-made hash, and payment results are trusted only from the signed notify call.

export const PAYHERE_CURRENCY = "LKR";

export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;

const md5Upper = (value: string) => createHash("md5").update(value).digest("hex").toUpperCase();

export function formatAmount(amount: number) {
  return amount.toFixed(2); // PayHere expects "1000.00", no thousands separators
}

export function checkoutUrl() {
  return env().PAYHERE_SANDBOX
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";
}

export function generateCheckoutHash(orderId: string, amount: number) {
  const { PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET } = env();
  return md5Upper(
    PAYHERE_MERCHANT_ID + orderId + formatAmount(amount) + PAYHERE_CURRENCY + md5Upper(PAYHERE_MERCHANT_SECRET),
  );
}

type CheckoutOrder = {
  id: string;
  number: number;
  customerName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  total: number;
  items: { quantity: number }[];
};

/** All fields for the form the browser POSTs to PayHere. Built only on the server. */
export function buildCheckoutFields(order: CheckoutOrder, returnPath: string) {
  const { PAYHERE_MERCHANT_ID, APP_URL } = env();
  const orderId = `TL-${order.number}`;
  const [firstName, ...rest] = order.customerName.split(" ");
  const units = order.items.reduce((s, i) => s + i.quantity, 0);

  return {
    action: checkoutUrl(),
    fields: {
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${APP_URL}${returnPath}`,
      cancel_url: `${APP_URL}${returnPath}${returnPath.includes("?") ? "&" : "?"}cancelled=1`,
      notify_url: `${APP_URL}/api/payhere/notify`,
      order_id: orderId,
      items: `Threadline order ${orderId} (${units} item${units === 1 ? "" : "s"})`,
      currency: PAYHERE_CURRENCY,
      amount: formatAmount(order.total),
      first_name: firstName,
      last_name: rest.join(" ") || firstName,
      email: order.email,
      phone: order.phone,
      address: order.addressLine,
      city: order.city,
      country: "Sri Lanka",
      custom_1: order.id,
      hash: generateCheckoutHash(orderId, order.total),
    },
  };
}

export type PayHereCheckout = ReturnType<typeof buildCheckoutFields>;

export type PayHereNotification = {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
};

export function verifyNotification(n: PayHereNotification) {
  const { PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET } = env();
  if (n.merchant_id !== PAYHERE_MERCHANT_ID) return false;

  const expected = md5Upper(
    n.merchant_id + n.order_id + n.payhere_amount + n.payhere_currency + n.status_code + md5Upper(PAYHERE_MERCHANT_SECRET),
  );
  const received = (n.md5sig ?? "").toUpperCase();
  return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
