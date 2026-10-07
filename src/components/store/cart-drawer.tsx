"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { buttonVariants } from "@/components/ui/button";
import { useCart, useCartHydrated, type CartLine } from "@/lib/cart-store";
import { calculateTotals, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function QuantityStepper({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const size = compact ? "h-8 w-8" : "h-9 w-9";
  return (
    <div className="inline-flex items-center border">
      <button
        className={cn(size, "flex items-center justify-center hover:bg-surface disabled:opacity-30")}
        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
        disabled={line.quantity <= 1}
        aria-label={`Decrease quantity of ${line.name}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={line.stock}
        value={line.quantity}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= 1) setQuantity(line.variantId, Math.floor(v));
        }}
        aria-label={`Quantity of ${line.name}, ${line.colour}, ${line.size}`}
        className="h-8 w-12 border-x bg-transparent text-center text-[14px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        className={cn(size, "flex items-center justify-center hover:bg-surface disabled:opacity-30")}
        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
        disabled={line.quantity >= line.stock}
        aria-label={`Increase quantity of ${line.name}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const hydrated = useCartHydrated();
  const { lines, isOpen, close, remove } = useCart();
  const totals = calculateTotals(lines);
  const toFreeShipping = FREE_SHIPPING_THRESHOLD - (totals.subtotal - totals.discount);

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title={`Your cart${hydrated && lines.length ? ` (${lines.reduce((s, l) => s + l.quantity, 0)})` : ""}`}
      footer={
        hydrated && lines.length > 0 ? (
          <div className="space-y-3">
            <dl className="space-y-1.5 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Bulk discount</dt>
                  <dd>−{formatPrice(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{totals.shippingFee === 0 ? "Free" : formatPrice(totals.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-[16px] font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(totals.total)}</dd>
              </div>
            </dl>
            {toFreeShipping > 0 && (
              <p className="text-[12px] text-muted">Add {formatPrice(toFreeShipping)} more for free delivery.</p>
            )}
            <Link href="/checkout" onClick={close} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              Checkout
            </Link>
          </div>
        ) : undefined
      }
    >
      {!hydrated ? null : lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
          <p className="text-muted">Your cart is empty.</p>
          <Link href="/shop" onClick={close} className={buttonVariants({ variant: "outline" })}>
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="divide-y">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 p-5">
              <Link href={`/product/${line.slug}`} onClick={close} className="relative h-28 w-21 shrink-0 bg-surface">
                <Image src={line.image} alt={line.name} fill sizes="84px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <Link href={`/product/${line.slug}`} onClick={close} className="truncate text-[14px] font-medium">
                    {line.name}
                  </Link>
                  <button
                    onClick={() => remove(line.variantId)}
                    className="text-muted hover:text-sale"
                    aria-label={`Remove ${line.name} ${line.size} from cart`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">
                  {line.colour} · {line.size}
                </p>
                <div className="mt-auto flex items-end justify-between pt-2">
                  <QuantityStepper line={line} compact />
                  <p className="text-[14px] font-semibold">{formatPrice(line.unitPrice * line.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
