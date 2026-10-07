import "server-only";
import { db } from "@/lib/db";
import { calculateTotals } from "@/lib/pricing";
import type { checkoutSchema } from "@/lib/validations";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { z } from "zod";
import { deductStockForOrder, InsufficientStockError, restockOrder } from "./inventory";

type CheckoutData = z.output<typeof checkoutSchema>;

export type CartProblem = { variantId: string; message: string; available: number };

/**
 * Creates a PENDING order from a validated checkout request.
 *
 * Never trusts the browser: product names, prices and stock are re-read from the
 * database, and totals are recalculated here. Stock is checked now but only deducted
 * when the order is confirmed (PayHere payment verified, or admin confirms a WhatsApp
 * order), so abandoned checkouts never lock up inventory.
 */
export async function createOrder(data: CheckoutData) {
  // Merge duplicate lines for the same variant.
  const qtyByVariant = new Map<string, number>();
  for (const line of data.items) qtyByVariant.set(line.variantId, (qtyByVariant.get(line.variantId) ?? 0) + line.quantity);

  const variants = await db.productVariant.findMany({
    where: { id: { in: [...qtyByVariant.keys()] } },
    include: { product: { select: { id: true, name: true, price: true, isActive: true } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const problems: CartProblem[] = [];
  for (const [variantId, quantity] of qtyByVariant) {
    const v = byId.get(variantId);
    if (!v || !v.product.isActive) {
      problems.push({ variantId, message: "This item is no longer available.", available: 0 });
    } else if (v.stock < quantity) {
      problems.push({
        variantId,
        available: v.stock,
        message: v.stock === 0 ? `${v.product.name} (${v.colour}, ${v.size}) is sold out.` : `Only ${v.stock} left of ${v.product.name} (${v.colour}, ${v.size}).`,
      });
    }
  }
  if (problems.length) return { ok: false as const, problems };

  const lines = [...qtyByVariant].map(([variantId, quantity]) => {
    const v = byId.get(variantId)!;
    return { variant: v, quantity, unitPrice: v.product.price, productId: v.product.id };
  });
  const totals = calculateTotals(lines);

  const order = await db.order.create({
    data: {
      customerName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      addressLine: data.addressLine,
      city: data.city,
      notes: data.notes || null,
      paymentMethod: data.paymentMethod,
      ...totals,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variant.id,
          productName: l.variant.product.name,
          size: l.variant.size,
          colour: l.variant.colour,
          sku: l.variant.sku,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          lineTotal: l.unitPrice * l.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return { ok: true as const, order };
}

// ---------------------------------------------------------------------------
// Order lifecycle
//
//   PENDING ──► CONFIRMED ──► PROCESSING ──► SHIPPED ──► DELIVERED
//      │            │              │
//      └────────────┴──────────────┴──► CANCELLED
//
// Stock is deducted on entering CONFIRMED and returned if a confirmed order is cancelled.
// ---------------------------------------------------------------------------

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export class OrderTransitionError extends Error {}

export async function changeOrderStatus(orderId: string, next: OrderStatus) {
  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

      if (!ORDER_TRANSITIONS[order.status].includes(next)) {
        throw new OrderTransitionError(`An order can't move from ${order.status} to ${next}.`);
      }
      if (next === "CONFIRMED" && order.paymentMethod === "PAYHERE" && order.paymentStatus !== "PAID") {
        throw new OrderTransitionError("PayHere orders are confirmed automatically once the payment is verified.");
      }

      if (next === "CONFIRMED") await deductStockForOrder(tx, orderId);
      if (next === "CANCELLED") await restockOrder(tx, orderId);

      return tx.order.update({ where: { id: orderId }, data: { status: next } });
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) {
      const list = e.items.map((i) => `${i.productName} ${i.colour}/${i.size} (needs ${i.requested})`).join(", ");
      throw new OrderTransitionError(`Not enough stock to confirm: ${list}. Update inventory or cancel the order.`);
    }
    throw e;
  }
}

/**
 * Applies a verified PayHere payment. Safe to call repeatedly: PayHere can retry
 * the notification, and a paid order is never processed twice.
 */
export async function markOrderPaid(orderId: string, paymentId: string, statusCode: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.paymentStatus === "PAID") return order;

  try {
    return await db.$transaction(async (tx) => {
      await deductStockForOrder(tx, orderId);
      return tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: order.status === "PENDING" ? "CONFIRMED" : order.status,
          payherePaymentId: paymentId,
          payhereStatus: statusCode,
        },
      });
    });
  } catch (e) {
    if (!(e instanceof InsufficientStockError)) throw e;
    // The customer has paid but stock ran out between checkout and payment.
    // Record the payment anyway; the admin panel flags this order (stockDeducted = false)
    // so staff can restock, substitute or refund.
    return db.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "CONFIRMED", payherePaymentId: paymentId, payhereStatus: statusCode },
    });
  }
}
