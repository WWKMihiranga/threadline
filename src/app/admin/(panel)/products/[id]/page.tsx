import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { SIZES } from "@/lib/validations";

export const metadata = { title: "Edit product" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: { orderBy: [{ colour: "asc" }] } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const rank = (s: string) => (SIZES as readonly string[]).indexOf(s);
  const variants = [...product.variants].sort((a, b) => a.colour.localeCompare(b.colour) || rank(a.size) - rank(b.size));

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader
        title={product.name}
        actions={
          product.isActive ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
              View in store <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />
      <ProductForm
        key={product.updatedAt.toISOString()}
        productId={product.id}
        categories={categories}
        initial={{
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          images: product.images,
          isActive: product.isActive,
          isNew: product.isNew,
          isFeatured: product.isFeatured,
          variants: variants.map((v) => ({
            id: v.id,
            size: v.size as (typeof SIZES)[number],
            colour: v.colour,
            colourHex: v.colourHex,
            sku: v.sku,
            stock: v.stock,
          })),
        }}
      />
    </>
  );
}
