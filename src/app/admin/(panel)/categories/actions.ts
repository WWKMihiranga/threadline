"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

export type CategoryState = { ok?: boolean; error?: string };
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(40);

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function createCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const count = await db.category.count();
    await db.category.create({ data: { name: parsed.data, slug: slugify(parsed.data), sortOrder: count } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "A category with that name already exists." };
    throw e;
  }
  refresh();
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<CategoryState> {
  await requireAdmin();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    // The slug is kept, so existing /shop?category= links keep working.
    await db.category.update({ where: { id: String(id) }, data: { name: parsed.data } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "A category with that name already exists." };
    throw e;
  }
  refresh();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<CategoryState> {
  await requireAdmin();
  const products = await db.product.count({ where: { categoryId: String(id) } });
  if (products > 0) return { error: `Move or delete its ${products} product${products === 1 ? "" : "s"} first.` };
  await db.category.delete({ where: { id: String(id) } });
  refresh();
  return { ok: true };
}
