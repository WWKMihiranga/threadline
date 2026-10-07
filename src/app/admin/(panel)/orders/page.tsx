import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyRow, OrderStatusBadge, PageHeader, PaymentBadge, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/validations";
import type { Prisma } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };
const PER_PAGE = 20;

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");

  const status = ORDER_STATUSES.find((s) => s === one("status"));
  const method = one("method") === "PAYHERE" || one("method") === "WHATSAPP" ? (one("method") as "PAYHERE" | "WHATSAPP") : undefined;
  const q = one("q").slice(0, 80);
  const page = Math.max(1, Number(one("page")) || 1);

  const where: Prisma.OrderWhereInput = { AND: [] };
  const and = where.AND as Prisma.OrderWhereInput[];
  if (status) and.push({ status });
  if (method) and.push({ paymentMethod: method });
  if (one("flag") === "stock") and.push({ paymentStatus: "PAID", stockDeducted: false, status: { not: "CANCELLED" } });
  if (q) {
    const num = Number(q.replace(/^TL-?/i, ""));
    and.push({
      OR: [
        ...(Number.isInteger(num) && num > 0 ? [{ number: num }] : []),
        { customerName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\s/g, "") } },
      ],
    });
  }

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { items: { select: { quantity: true } } },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status, method, q: q || undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${total} ${total === 1 ? "order" : "orders"}${status ? ` · ${status.toLowerCase()}` : ""}`} />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b">
        {[undefined, ...ORDER_STATUSES].map((s) => {
          const c = s ? counts.find((x) => x.status === s)?._count ?? 0 : counts.reduce((n, x) => n + x._count, 0);
          return (
            <Link
              key={s ?? "all"}
              href={href({ status: s, page: undefined })}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[13px] capitalize",
                status === s ? "border-foreground font-medium" : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {s ? s.toLowerCase() : "All"} <span className="text-muted">({c})</span>
            </Link>
          );
        })}
      </div>

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search order #, name, phone or email" className="h-10 w-full border bg-white pl-9 pr-3 text-[14px] outline-none focus:border-foreground" aria-label="Search orders" />
        </div>
        <select name="method" defaultValue={method ?? ""} className="h-10 border bg-white px-3 text-[14px]" aria-label="Payment method">
          <option value="">All methods</option>
          <option value="PAYHERE">PayHere</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
        <button className="h-10 bg-foreground px-5 text-[13px] uppercase tracking-wider text-white">Filter</button>
      </form>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full min-w-[760px]">
          <thead className="border-b bg-surface/50">
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Date</th>
              <th className={th}>Customer</th>
              <th className={th}>Items</th>
              <th className={th}>Method</th>
              <th className={th}>Payment</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface/40">
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                    {formatOrderNumber(o.number)}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(o.createdAt)}</td>
                <td className={td}>
                  {o.customerName}
                  <p className="text-[12px] text-muted">{o.phone}</p>
                </td>
                <td className={td}>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className={td}>{o.paymentMethod === "WHATSAPP" ? "WhatsApp" : "PayHere"}</td>
                <td className={td}><PaymentBadge status={o.paymentStatus} /></td>
                <td className={td}><OrderStatusBadge status={o.status} /></td>
                <td className={`${td} text-right font-medium`}>{formatPrice(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && <EmptyRow colSpan={8}>No orders match these filters.</EmptyRow>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-[14px]" aria-label="Pagination">
          <span className="text-muted">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={href({ page: String(page - 1) })} className="border bg-white px-4 py-2 hover:border-foreground">Previous</Link>}
            {page < pages && <Link href={href({ page: String(page + 1) })} className="border bg-white px-4 py-2 hover:border-foreground">Next</Link>}
          </div>
        </nav>
      )}
    </>
  );
}
