import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { buildCheckoutFields } from "@/lib/payhere";
import { orderPagePath, verifyOrderAccessToken } from "@/lib/order-token";
import { buildWhatsAppMessage, whatsAppUrl } from "@/lib/whatsapp";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentPoller, RetryPaymentButton } from "./order-actions";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const token = typeof sp.t === "string" ? sp.t : undefined;

  // Same 404 for "doesn't exist" and "bad token", so order ids can't be probed.
  if (!verifyOrderAccessToken(id, token)) notFound();
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const number = formatOrderNumber(order.number);
  const cancelled = sp.cancelled === "1";
  const isWhatsApp = order.paymentMethod === "WHATSAPP";
  const paid = order.paymentStatus === "PAID";
  const canPay = !isWhatsApp && !paid && order.status === "PENDING";
  const waLink = isWhatsApp ? whatsAppUrl(env().WHATSAPP_NUMBER, buildWhatsAppMessage(order)) : null;

  return (
    <div className="container-page max-w-3xl pt-12 md:pt-16">
      {/* Status banner */}
      <div className="text-center">
        {isWhatsApp ? (
          <>
            <MessageCircle className="mx-auto h-12 w-12 text-whatsapp" strokeWidth={1.25} />
            <p className="label mt-5 text-muted">Order {number} saved</p>
            <h1 className="mt-2 text-2xl md:text-3xl">One last step: send it on WhatsApp</h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
              Tap the button to open WhatsApp with your order ready to send. Our team will confirm availability, delivery and payment with you there.
            </p>
            <a href={waLink!} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }), "mt-7 w-full sm:w-auto")}>
              <MessageCircle className="h-4 w-4" /> Send order on WhatsApp
            </a>
          </>
        ) : paid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" strokeWidth={1.25} />
            <p className="label mt-5 text-muted">Order {number}</p>
            <h1 className="mt-2 text-2xl md:text-3xl">Thank you, payment received</h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
              We&apos;ve confirmed your order and will start packing it. We&apos;ll contact you on {order.phone} when it ships.
            </p>
          </>
        ) : order.paymentStatus === "FAILED" || cancelled ? (
          <>
            <CircleAlert className="mx-auto h-12 w-12 text-sale" strokeWidth={1.25} />
            <p className="label mt-5 text-muted">Order {number}</p>
            <h1 className="mt-2 text-2xl md:text-3xl">{cancelled ? "Payment cancelled" : "Payment didn't go through"}</h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">Your order is saved. You can try again whenever you&apos;re ready; you won&apos;t be charged twice.</p>
          </>
        ) : (
          <>
            <p className="label text-muted">Order {number}</p>
            <h1 className="mt-2 text-2xl md:text-3xl">Almost there</h1>
            <div className="mt-4 flex justify-center">
              {order.payhereStatus || !canPay ? <PaymentPoller /> : <p className="text-[14px] text-muted">Complete your payment to confirm this order.</p>}
            </div>
          </>
        )}

        {canPay && (
          <div className="mt-7 flex justify-center">
            <RetryPaymentButton checkout={buildCheckoutFields(order, orderPagePath(order.id))} label={`Pay ${formatPrice(order.total)} with PayHere`} />
          </div>
        )}
      </div>

      {/* Order details */}
      <section className="mt-14 border" aria-labelledby="details-h">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-surface px-5 py-4">
          <h2 id="details-h" className="text-base">Order details</h2>
          <p className="text-[13px] text-muted">
            {isWhatsApp ? "WhatsApp order" : "PayHere"} · Status: <span className="font-medium text-foreground">{order.status.toLowerCase()}</span>
          </p>
        </div>
        <ul className="divide-y px-5">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3.5 text-[14px]">
              <div>
                <p>{i.productName}</p>
                <p className="text-[13px] text-muted">
                  {i.colour} · {i.size} · {i.quantity} × {formatPrice(i.unitPrice)}
                </p>
              </div>
              <p>{formatPrice(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t px-5 py-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Bulk discount</dt>
              <dd>−{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-[16px] font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <div className="grid gap-4 border-t px-5 py-4 text-[14px] sm:grid-cols-2">
          <div>
            <p className="label mb-1.5 text-muted">Deliver to</p>
            <p>{order.customerName}</p>
            <p className="text-muted">
              {order.addressLine}, {order.city}
            </p>
          </div>
          <div>
            <p className="label mb-1.5 text-muted">Contact</p>
            <p>{order.phone}</p>
            <p className="text-muted">{order.email}</p>
          </div>
        </div>
      </section>

      <p className="mt-8 text-center text-[14px] text-muted">
        Save your order number <span className="font-medium text-foreground">{number}</span>. You can check its status any time on the{" "}
        <Link href="/track" className="text-foreground underline underline-offset-4">
          order tracking page
        </Link>
        .
      </p>
    </div>
  );
}
