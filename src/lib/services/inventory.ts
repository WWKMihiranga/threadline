import "server-only";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class InsufficientStockError extends Error {
  constructor(public readonly items: { sku: string; productName: string; size: string; colour: string; requested: number }[]) {
    super(`Not enough stock for ${items.map((i) => i.sku).join(", ")}`);
    this.name = "InsufficientStockError";
  }
}

/**
 * Deducts stock for every line of an order inside the caller's transaction.
 *
 * Each decrement is conditional (`stock >= quantity`), so two orders racing for the
 * last few units can never push stock below zero: the database row is the source of
 * truth, not a value read earlier. If any line fails, the whole transaction rolls back.
 */
export async function deductStockForOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { stockDeducted: true, items: { select: { variantId: true, quantity: true, sku: true, productName: true, size: true, colour: true } } },
  });
  if (order.stockDeducted) return; // idempotent: PayHere may call notify more than once

  const short: InsufficientStockError["items"] = [];
  for (const item of order.items) {
    if (!item.variantId) continue; // variant was deleted after ordering; nothing to deduct
    const result = await tx.productVariant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (result.count !== 1) short.push({ ...item, requested: item.quantity });
  }
  if (short.length) throw new InsufficientStockError(short);

  await tx.order.update({ where: { id: orderId }, data: { stockDeducted: true } });
}

/** Returns an order's units to stock (used when a confirmed order is cancelled). */
export async function restockOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { stockDeducted: true, items: { select: { variantId: true, quantity: true } } },
  });
  if (!order.stockDeducted) return;

  for (const item of order.items) {
    if (!item.variantId) continue;
    await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
  }
  await tx.order.update({ where: { id: orderId }, data: { stockDeducted: false } });
}
