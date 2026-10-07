"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { productSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

export type SaveProductResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "product";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const clash = await db.product.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined }, select: { id: true } });
    if (!clash) return slug;
  }
}

function refreshStore() {
  revalidatePath("/", "layout");
}

export async function saveProduct(input: unknown, productId?: string): Promise<SaveProductResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
  if (!category) return { ok: false, error: "Choose a valid category.", fieldErrors: { categoryId: ["Choose a valid category"] } };

  const productData = {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    price: data.price,
    compareAtPrice: data.compareAtPrice || null,
    images: data.images,
    isActive: data.isActive,
    isNew: data.isNew,
    isFeatured: data.isFeatured,
  };

  try {
    const id = await db.$transaction(async (tx) => {
      if (!productId) {
        const created = await tx.product.create({
          data: {
            ...productData,
            slug: await uniqueSlug(data.name),
            variants: { create: data.variants.map((v) => ({ size: v.size, colour: v.colour, colourHex: v.colourHex, sku: v.sku, stock: v.stock })) },
          },
        });
        return created.id;
      }

      const existing = await tx.product.findUnique({ where: { id: productId }, include: { variants: { select: { id: true } } } });
      if (!existing) throw new Error("NOT_FOUND");

      await tx.product.update({
        where: { id: productId },
        data: { ...productData, slug: existing.name === data.name ? undefined : await uniqueSlug(data.name, productId) },
      });

      // Sync variants: delete removed rows, update existing ones, create new ones.
      // Ids are checked against this product's own variants, so a tampered request
      // can't edit another product's stock. Past orders keep their item snapshot
      // (OrderItem.variantId is set to null on delete).
      const ownIds = new Set(existing.variants.map((v) => v.id));
      const keepIds = data.variants.map((v) => v.id).filter((id): id is string => !!id && ownIds.has(id));
      await tx.productVariant.deleteMany({ where: { productId, id: { notIn: keepIds } } });

      // Two passes so swapping SKUs or size/colour between rows doesn't hit unique constraints mid-way.
      for (const v of data.variants) {
        if (v.id && ownIds.has(v.id)) await tx.productVariant.update({ where: { id: v.id }, data: { sku: `__tmp_${v.id}`, size: `__${v.id}` } });
      }
      for (const { id: variantId, ...v } of data.variants) {
        if (variantId && ownIds.has(variantId)) await tx.productVariant.update({ where: { id: variantId }, data: v });
        else await tx.productVariant.create({ data: { ...v, productId } });
      }
      return productId;
    });

    refreshStore();
    revalidatePath("/admin", "layout");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return { ok: false, error: "This product no longer exists." };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "One of these SKUs is already used by another product.", fieldErrors: { variants: ["SKUs must be unique across the store"] } };
    }
    console.error("[admin] save product failed", e);
    return { ok: false, error: "Couldn't save the product. Please try again." };
  }
}

export async function deleteProduct(productId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await db.product.delete({ where: { id: String(productId) } });
  } catch {
    return { ok: false, error: "Couldn't delete this product." };
  }
  refreshStore();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setProductActive(productId: string, isActive: boolean) {
  await requireAdmin();
  await db.product.update({ where: { id: String(productId) }, data: { isActive: Boolean(isActive) } });
  refreshStore();
  revalidatePath("/admin/products");
}
