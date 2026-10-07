import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { formatAmount, PAYHERE_CURRENCY, PAYHERE_STATUS, verifyNotification, type PayHereNotification } from "@/lib/payhere";
import { markOrderPaid } from "@/lib/services/orders";
import { parseOrderNumber } from "@/lib/format";

/**
 * POST /api/payhere/notify: server-to-server callback from PayHere.
 *
 * This is the ONLY place an order becomes paid. The browser's return_url redirect
 * proves nothing (anyone can open that URL), so payment state changes only after:
 *   1. md5sig matches (proves the request came from PayHere and wasn't altered)
 *   2. the order exists and the paid amount + currency match what we charged
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const n = Object.fromEntries(
    ["merchant_id", "order_id", "payment_id", "payhere_amount", "payhere_currency", "status_code", "md5sig"].map((k) => [
      k,
      String(form.get(k) ?? ""),
    ]),
  ) as PayHereNotification;

  if (!verifyNotification(n)) {
    console.warn("[payhere] rejected notification with invalid signature", { order: n.order_id });
    return new Response("Invalid signature", { status: 400 });
  }

  const number = parseOrderNumber(n.order_id);
  const order = number ? await db.order.findUnique({ where: { number } }) : null;
  if (!order) {
    console.warn("[payhere] notification for unknown order", n.order_id);
    return new Response("Unknown order", { status: 404 });
  }

  if (n.payhere_currency !== PAYHERE_CURRENCY || n.payhere_amount !== formatAmount(order.total)) {
    console.error("[payhere] amount mismatch", { order: n.order_id, expected: formatAmount(order.total), got: n.payhere_amount });
    await db.order.update({ where: { id: order.id }, data: { payhereStatus: `amount_mismatch:${n.payhere_amount}` } });
    return new Response("Amount mismatch", { status: 400 });
  }

  switch (n.status_code) {
    case PAYHERE_STATUS.SUCCESS:
      await markOrderPaid(order.id, n.payment_id, n.status_code);
      break;
    case PAYHERE_STATUS.FAILED:
    case PAYHERE_STATUS.CHARGEDBACK:
      if (order.paymentStatus !== "PAID" || n.status_code === PAYHERE_STATUS.CHARGEDBACK) {
        await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", payhereStatus: n.status_code } });
      }
      break;
    default: // pending (0) or cancelled (-1): record it, the order stays open for another attempt
      if (order.paymentStatus !== "PAID") {
        await db.order.update({ where: { id: order.id }, data: { payhereStatus: n.status_code } });
      }
  }

  revalidatePath("/admin", "layout");
  return new Response("OK");
}
