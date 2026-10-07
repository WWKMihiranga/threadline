import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, MessageCircle } from "lucide-react";
import { Card, OrderStatusBadge, PageHeader, PaymentBadge, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";
import { ORDER_TRANSITIONS } from "@/lib/services/orders";
import { OrderControls } from "./order-controls";

export const metadata = { title: "Order" };

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { variant: { select: { stock: true } } } } },
  });
  if (!order) notFound();

  let next = ORDER_TRANSITIONS[order.status];
  let blockedReason: string | undefined;
  if (order.status === "PENDING" && order.paymentMethod === "PAYHERE" && order.paymentStatus !== "PAID") {
    next = next.filter((s) => s !== "CONFIRMED");
    blockedReason = "Waiting for PayHere. This order confirms automatically when payment is verified.";
  }
  const stockProblem = order.paymentStatus === "PAID" && !order.stockDeducted && order.status !== "CANCELLED";
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const customerWa = `https://wa.me/94${order.phone.slice(1)}?text=${encodeURIComponent(`Hi ${order.customerName.split(" ")[0]}, this is Threadline about your order ${formatOrderNumber(order.number)}.`)}`;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>
      <PageHeader
        title={`Order ${formatOrderNumber(order.number)}`}
        description={`Placed ${formatDate(order.createdAt)} · ${order.paymentMethod === "WHATSAPP" ? "WhatsApp order" : "PayHere online payment"}`}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </>
        }
      />

      {stockProblem && (
        <div className="mb-6 flex gap-3 border border-sale/40 bg-sale/5 px-5 py-4 text-[14px] text-sale">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            Payment was received, but some items were out of stock when it arrived, so stock was <strong>not</strong> deducted. Restock or contact the customer about a substitute or refund.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card title={`Items (${units})`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="border-b bg-surface/50">
                  <tr>
                    <th className={th}>Product</th>
                    <th className={th}>SKU</th>
                    <th className={`${th} text-right`}>Qty</th>
                    <th className={`${th} text-right`}>Price</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className={td}>
                        {i.productId ? <Link href={`/admin/products/${i.productId}`} className="hover:underline">{i.productName}</Link> : i.productName}
                        <p className="text-[12px] text-muted">
                          {i.colour} · {i.size}
                          {order.status === "PENDING" && i.variant && <> · {i.variant.stock} in stock</>}
                        </p>
                      </td>
                      <td className={`${td} font-mono text-[12px] text-muted`}>{i.sku}</td>
                      <td className={`${td} text-right`}>{i.quantity}</td>
                      <td className={`${td} text-right`}>{formatPrice(i.unitPrice)}</td>
                      <td className={`${td} text-right`}>{formatPrice(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="space-y-1.5 border-t px-5 py-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-success"><dt>Bulk discount</dt><dd>−{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd></div>
              <div className="flex justify-between pt-1 text-[16px] font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Customer">
              <div className="space-y-1 px-5 py-4 text-[14px]">
                <p className="font-medium">{order.customerName}</p>
                <p><a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a></p>
                <p><a href={`mailto:${order.email}`} className="text-muted hover:underline">{order.email}</a></p>
                <a href={customerWa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-whatsapp hover:underline">
                  <MessageCircle className="h-4 w-4" /> Message on WhatsApp
                </a>
              </div>
            </Card>
            <Card title="Delivery">
              <div className="space-y-1 px-5 py-4 text-[14px]">
                <p>{order.addressLine}</p>
                <p>{order.city}</p>
                {order.notes && <p className="mt-3 bg-surface p-3 text-[13px] text-muted">“{order.notes}”</p>}
              </div>
            </Card>
          </div>

          {order.paymentMethod === "PAYHERE" && (
            <Card title="PayHere">
              <dl className="grid grid-cols-2 gap-y-2 px-5 py-4 text-[14px]">
                <dt className="text-muted">Payment ID</dt><dd className="font-mono text-[13px]">{order.payherePaymentId ?? "—"}</dd>
                <dt className="text-muted">Last status code</dt><dd className="font-mono text-[13px]">{order.payhereStatus ?? "No notification yet"}</dd>
              </dl>
            </Card>
          )}
        </div>

        <Card title="Update order" className="self-start lg:sticky lg:top-10">
          <div className="p-5">
            <OrderControls
              orderId={order.id}
              next={next}
              blockedReason={blockedReason}
              canMarkPaid={order.paymentMethod === "WHATSAPP" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED"}
            />
            <p className="mt-6 border-t pt-4 text-[12px] text-muted">Stock deducted: {order.stockDeducted ? "yes" : "no"}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
