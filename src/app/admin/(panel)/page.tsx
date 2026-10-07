import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, EmptyRow, OrderStatusBadge, PageHeader, PaymentBadge, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const LOW_STOCK = 5;
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export default async function DashboardPage() {
  await requireAdmin(); // layouts aren't re-run on every navigation, so each page checks too

  const since = daysAgo(30);
  const [revenue, ordersByStatus, recent, lowStock, flagged] = await Promise.all([
    // Revenue counts confirmed-and-onwards orders (paid online, or confirmed via WhatsApp)
    db.order.aggregate({
      where: { createdAt: { gte: since }, status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { _count: { select: { items: true } } } }),
    db.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { isActive: true } },
      orderBy: { stock: "asc" },
      take: 8,
      include: { product: { select: { id: true, name: true } } },
    }),
    // Paid, but stock couldn't be deducted (sold out between checkout and payment)
    db.order.count({ where: { paymentStatus: "PAID", stockDeducted: false, status: { not: "CANCELLED" } } }),
  ]);

  const count = (s: string) => ordersByStatus.find((o) => o.status === s)?._count ?? 0;
  const stats = [
    { label: "Revenue (30 days)", value: formatPrice(revenue._sum.total ?? 0), sub: `${revenue._count} confirmed orders` },
    { label: "Awaiting confirmation", value: count("PENDING"), sub: "Pending orders", href: "/admin/orders?status=PENDING" },
    { label: "To fulfil", value: count("CONFIRMED") + count("PROCESSING"), sub: "Confirmed + packing", href: "/admin/orders?status=CONFIRMED" },
    { label: "Low stock variants", value: lowStock.length, sub: `${LOW_STOCK} or fewer left`, href: "/admin/inventory?low=1" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of orders and inventory." />

      {flagged > 0 && (
        <Link href="/admin/orders?flag=stock" className="mb-6 flex items-center gap-3 border border-sale/40 bg-sale/5 px-5 py-4 text-[14px] text-sale">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {flagged} paid {flagged === 1 ? "order needs" : "orders need"} attention: payment received but there wasn&apos;t enough stock to deduct.
        </Link>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-[12px] text-muted">{s.label}</p>
              <p className="mt-2 font-display text-2xl">{s.value}</p>
              <p className="mt-1 text-[12px] text-muted">{s.sub}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="border bg-white p-5 transition-colors hover:border-foreground/40">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="border bg-white p-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[13px] text-muted hover:text-foreground">View all</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="border-b bg-surface/50">
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Status</th>
                  <th className={th}>Payment</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/40">
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                        {formatOrderNumber(o.number)}
                      </Link>
                      <p className="text-[12px] text-muted">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className={td}>
                      {o.customerName}
                      <p className="text-[12px] text-muted">{o.paymentMethod === "WHATSAPP" ? "WhatsApp" : "PayHere"}</p>
                    </td>
                    <td className={td}><OrderStatusBadge status={o.status} /></td>
                    <td className={td}><PaymentBadge status={o.paymentStatus} /></td>
                    <td className={`${td} text-right`}>{formatPrice(o.total)}</td>
                  </tr>
                ))}
                {recent.length === 0 && <EmptyRow colSpan={5}>No orders yet.</EmptyRow>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Low stock" actions={<Link href="/admin/inventory?low=1" className="text-[13px] text-muted hover:text-foreground">Manage</Link>}>
          <ul className="divide-y">
            {lowStock.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
                <div className="min-w-0">
                  <Link href={`/admin/products/${v.product.id}`} className="block truncate hover:underline">
                    {v.product.name}
                  </Link>
                  <p className="text-[12px] text-muted">
                    {v.colour} · {v.size} · {v.sku}
                  </p>
                </div>
                <span className={v.stock === 0 ? "font-semibold text-sale" : "font-semibold text-amber-700"}>{v.stock === 0 ? "Sold out" : v.stock}</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="px-5 py-10 text-center text-[14px] text-muted">All variants are well stocked.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
