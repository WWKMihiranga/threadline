import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE, type ShopFilters } from "@/lib/shop-filters";

// Read-only data access for the storefront. Only active products are ever exposed.

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: true,
  isNew: true,
  variants: { select: { colour: true, colourHex: true, stock: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function getShopProducts(f: ShopFilters) {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { description: { contains: f.q, mode: "insensitive" } },
        { category: { name: { contains: f.q, mode: "insensitive" } } },
        { variants: { some: { colour: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.sale) and.push({ compareAtPrice: { not: null } });
  if (f.isNew) and.push({ isNew: true });
  if (f.min !== undefined || f.max !== undefined) and.push({ price: { gte: f.min, lte: f.max } });

  // Size and colour must match the SAME in-stock variant: "Black in M" should not
  // match a product that only has Black in S and White in M.
  if (f.sizes.length || f.colours.length) {
    and.push({
      variants: {
        some: {
          stock: { gt: 0 },
          ...(f.sizes.length ? { size: { in: f.sizes } } : {}),
          ...(f.colours.length ? { colour: { in: f.colours, mode: "insensitive" } } : {}),
        },
      },
    });
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = {
    newest: [{ createdAt: "desc" as const }],
    "price-asc": [{ price: "asc" as const }],
    "price-desc": [{ price: "desc" as const }],
    name: [{ name: "asc" as const }],
  }[f.sort];
  orderBy.push({ id: "asc" }); // stable pagination

  const where = { AND: and };
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: productCardSelect }),
  ]);
  return { total, products, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Colours that exist on active products, for the filter sidebar. */
export async function getColourOptions() {
  const rows = await db.productVariant.findMany({
    where: { product: { isActive: true } },
    distinct: ["colour"],
    select: { colour: true, colourHex: true },
    orderBy: { colour: "asc" },
  });
  return rows.map((r) => ({ name: r.colour, hex: r.colourHex }));
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { orderBy: [{ colour: "asc" }] },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  return db.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
  });
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getNewArrivals(limit = 8) {
  return db.product.findMany({
    where: { isActive: true, isNew: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { ...productCardSelect, category: { select: { slug: true } } },
  });
}
