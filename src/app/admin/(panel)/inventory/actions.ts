"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

const input = z.object({ variantId: z.string().min(1).max(40), stock: z.coerce.number().int().min(0).max(100000) });

export async function updateStock(variantId: string, stock: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const parsed = input.safeParse({ variantId, stock });
  if (!parsed.success) return { ok: false, error: "Stock must be a whole number of 0 or more." };

  const updated = await db.productVariant.updateMany({ where: { id: parsed.data.variantId }, data: { stock: parsed.data.stock } });
  if (updated.count !== 1) return { ok: false, error: "Variant not found." };

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}
