import Image from "next/image";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyRow, PageHeader, td, th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VisibilityToggle } from "./visibility-toggle";

export const metadata = { title: "Products" };

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] } : {}),
        ...(category ? { categoryId: category } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } }, variants: { select: { stock: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} ${products.length === 1 ? "product" : "products"}`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" /> New product
          </Link>
        }
      />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search by name or SKU" className="h-10 w-full border bg-white pl-9 pr-3 text-[14px] outline-none focus:border-foreground" aria-label="Search products" />
        </div>
        <select name="category" defaultValue={category} className="h-10 border bg-white px-3 text-[14px]" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="h-10 bg-foreground px-5 text-[13px] uppercase tracking-wider text-white">Filter</button>
      </form>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-surface/50">
            <tr>
              <th className={th}>Product</th>
              <th className={th}>Category</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={`${th} text-right`}>Variants</th>
              <th className={`${th} text-right`}>Stock</th>
              <th className={th}>Visible</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => {
              const stock = p.variants.reduce((n, v) => n + v.stock, 0);
              const soldOut = p.variants.filter((v) => v.stock === 0).length;
              return (
                <tr key={p.id} className="hover:bg-surface/40">
                  <td className={td}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative h-14 w-11 shrink-0 bg-surface">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span>
                        <span className="font-medium hover:underline">{p.name}</span>
                        <span className="block text-[12px] text-muted">
                          {p.isNew && "New · "}
                          {p.compareAtPrice && "On sale · "}/{p.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}>{p.category.name}</td>
                  <td className={`${td} text-right`}>
                    {formatPrice(p.price)}
                    {p.compareAtPrice && <span className="block text-[12px] text-muted line-through">{formatPrice(p.compareAtPrice)}</span>}
                  </td>
                  <td className={`${td} text-right`}>
                    {p.variants.length}
                    {soldOut > 0 && <span className="block text-[12px] text-sale">{soldOut} sold out</span>}
                  </td>
                  <td className={cn(td, "text-right font-medium", stock === 0 && "text-sale")}>{stock}</td>
                  <td className={td}>
                    <VisibilityToggle productId={p.id} isActive={p.isActive} />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && <EmptyRow colSpan={6}>No products found.</EmptyRow>}
          </tbody>
        </table>
      </div>
    </>
  );
}
