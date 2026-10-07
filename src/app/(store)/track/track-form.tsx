"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { trackOrder, type TrackResult } from "./actions";

const STEPS = [
  { key: "PENDING", label: "Order placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PROCESSING", label: "Packing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackResult, FormData>(trackOrder, { status: "idle" });

  return (
    <div>
      <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number" htmlFor="number">
          <Input id="number" name="number" placeholder="TL-1001" required defaultValue={state.values?.number} autoComplete="off" />
        </Field>
        <Field label="Mobile number" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="077 123 4567" required defaultValue={state.values?.phone} autoComplete="tel" />
        </Field>
        <Button type="submit" disabled={pending} className="h-11">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Track
        </Button>
      </form>

      <div aria-live="polite">
        {state.status === "error" && <p className="mt-6 border border-sale/40 bg-sale/5 p-4 text-[14px] text-sale">{state.message}</p>}

        {state.status === "found" && (
          <div className="mt-10 border">
            <div className="flex flex-wrap justify-between gap-2 border-b bg-surface px-5 py-4 text-[14px]">
              <p className="font-medium">Order {formatOrderNumber(state.order.number)}</p>
              <p className="text-muted">Placed {formatDate(new Date(state.order.createdAt))}</p>
            </div>

            <div className="px-5 py-8">
              {state.order.status === "CANCELLED" ? (
                <p className="text-center font-medium text-sale">This order was cancelled.</p>
              ) : (
                <ol className="grid grid-cols-5 gap-1">
                  {STEPS.map((step, i) => {
                    const current = STEPS.findIndex((s) => s.key === state.order.status);
                    const done = i <= current;
                    return (
                      <li key={step.key} className="flex flex-col items-center gap-2 text-center">
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border", done ? "border-foreground bg-foreground text-white" : "text-muted")}>
                          {done ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        <span className={cn("text-[12px] sm:text-[13px]", i === current ? "font-medium" : "text-muted")}>{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {state.order.status === "PENDING" && (
                <p className="mt-6 text-center text-[13px] text-muted">
                  {state.order.paymentMethod === "WHATSAPP"
                    ? "We'll confirm your order once we've spoken with you on WhatsApp."
                    : "Waiting for your PayHere payment to be completed."}
                </p>
              )}
            </div>

            <ul className="divide-y border-t px-5 text-[14px]">
              {state.order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between py-3">
                  <span>
                    {i.productName} <span className="text-muted">· {i.colour} · {i.size}</span>
                  </span>
                  <span>× {i.quantity}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t px-5 py-4 text-[15px] font-semibold">
              <span>Total</span> <span>{formatPrice(state.order.total)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
