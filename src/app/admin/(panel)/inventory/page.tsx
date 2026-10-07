import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyRow, PageHeader, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { StockCell } from "./stock-cell";

export const metadata = { title: "Inventory" };

export default async function InventoryPage(props: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const low = sp.low === "1";

  const variants = await db.productVariant.findMany({
    where: {
      ...(low ? { stock: { lte: 5 } } : {}),
      ...(q
        ? { OR: [{ sku: { contains: q, mode: "insensitive" } }, { colour: { contains: q, mode: "insensitive" } }, { product: { name: { contains: q, mode: "insensitive" } } }] }
        : {}),
    },
    include: { product: { select: { id: true, name: true, isActive: true } } },
    orderBy: low ? [{ stock: "asc" }, { sku: "asc" }] : [{ product: { name: "asc" } }, { colour: "asc" }, { sku: "asc" }],
    take: 300,
  });
  const units = variants.reduce((n, v) => n + v.stock, 0);

  return (
    <>
      <PageHeader title="Inventory" description={`${variants.length} variants · ${units} units in stock`} />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 text-[13px]">
          <Link href={`/admin/inventory${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={cn("border px-3 py-2", !low ? "border-foreground bg-foreground text-white" : "bg-white")}>
            All
          </Link>
          <Link href={`/admin/inventory?low=1${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cn("border px-3 py-2", low ? "border-foreground bg-foreground text-white" : "bg-white")}>
            Low stock (≤ 5)
          </Link>
        </div>
        <form className="relative sm:w-72" role="search">
          {low && <input type="hidden" name="low" value="1" />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search product, colour or SKU" className="h-10 w-full border bg-white pl-9 pr-3 text-[14px] outline-none focus:border-foreground" aria-label="Search inventory" />
        </form>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-surface/50">
            <tr>
              <th className={th}>Product</th>
              <th className={th}>Variant</th>
              <th className={th}>SKU</th>
              <th className={`${th} text-right`}>Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {variants.map((v) => (
              <tr key={v.id} className="hover:bg-surface/40">
                <td className={td}>
                  <Link href={`/admin/products/${v.product.id}`} className="hover:underline">
                    {v.product.name}
                  </Link>
                  {!v.product.isActive && <span className="ml-2 text-[12px] text-muted">(hidden)</span>}
                </td>
                <td className={td}>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-black/15" style={{ backgroundColor: v.colourHex }} />
                    {v.colour} · {v.size}
                  </span>
                </td>
                <td className={`${td} font-mono text-[12px] text-muted`}>{v.sku}</td>
                <td className={`${td} py-2`}>
                  <StockCell variantId={v.id} stock={v.stock} label={`${v.product.name} ${v.colour}/${v.size}`} />
                </td>
              </tr>
            ))}
            {variants.length === 0 && <EmptyRow colSpan={4}>{low ? "Nothing is running low." : "No variants found."}</EmptyRow>}
          </tbody>
        </table>
      </div>
    </>
  );
}
