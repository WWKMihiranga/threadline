"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { changeOrderStatus, OrderTransitionError } from "@/lib/services/orders";
import { ORDER_STATUSES } from "@/lib/validations";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const statusInput = z.object({ orderId: z.string().min(1).max(40), status: z.enum(ORDER_STATUSES) });

function refresh(orderId: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/", "layout"); // storefront stock levels may have changed
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  await requireAdmin(); // every Server Action is a public POST endpoint, so check here, not just in the UI
  const parsed = statusInput.safeParse({ orderId, status });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  try {
    await changeOrderStatus(parsed.data.orderId, parsed.data.status);
  } catch (e) {
    if (e instanceof OrderTransitionError) return { ok: false, error: e.message };
    console.error("[admin] status change failed", e);
    return { ok: false, error: "Couldn't update the order. Please try again." };
  }
  refresh(parsed.data.orderId);
  return { ok: true, message: `Order marked as ${parsed.data.status.toLowerCase()}.` };
}

/** WhatsApp orders are paid outside the site (bank transfer / cash on delivery). */
export async function markWhatsAppOrderPaid(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  const order = await db.order.findUnique({ where: { id: String(orderId) } });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.paymentMethod !== "WHATSAPP") return { ok: false, error: "PayHere payments are recorded automatically." };
  if (order.status === "CANCELLED") return { ok: false, error: "This order is cancelled." };

  await db.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
  refresh(order.id);
  return { ok: true, message: "Payment recorded." };
}
