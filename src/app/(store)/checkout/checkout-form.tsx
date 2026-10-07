"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { calculateTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { checkoutSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { PayHereCheckout } from "@/lib/payhere";
import type { CartProblem } from "@/lib/services/orders";

const formSchema = checkoutSchema.omit({ items: true });
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

/** PayHere's Checkout API is a plain HTML form POST, so build one and submit it. */
function submitToPayHere({ action, fields }: PayHereCheckout) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const { lines, clear, setQuantity, remove } = useCart();
  const totals = calculateTotals(lines);
  const [problems, setProblems] = useState<CartProblem[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { paymentMethod: "PAYHERE", notes: "" },
    mode: "onTouched",
  });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const busy = isSubmitting || redirecting;

  async function onSubmit(values: FormOutput) {
    setProblems([]);
    let res: Response;
    try {
      res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) }),
      });
    } catch {
      toast.error("Network error. Check your connection and try again.");
      return;
    }
    const data = await res.json().catch(() => ({}));

    if (res.status === 422 && data.fieldErrors) {
      for (const [field, messages] of Object.entries(data.fieldErrors as Record<string, string[]>)) {
        if (field in formSchema.shape) setError(field as keyof FormInput, { message: messages[0] });
      }
      toast.error(data.error);
      return;
    }
    if (res.status === 409) {
      setProblems(data.problems);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setRedirecting(true);
    clear();
    if (data.payhere) submitToPayHere(data.payhere);
    else router.push(data.redirect);
  }

  function fixCart() {
    for (const p of problems) {
      if (p.available > 0) setQuantity(p.variantId, p.available);
      else remove(p.variantId);
    }
    setProblems([]);
    toast.success("Cart updated to match available stock.");
  }

  if (!hydrated) return <div className="h-96" />;

  if (lines.length === 0 && !redirecting) {
    return (
      <div className="flex flex-col items-center gap-5 bg-surface py-20 text-center">
        <p className="font-display text-xl uppercase tracking-wide">Your cart is empty</p>
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div className="space-y-10">
        {problems.length > 0 && (
          <div role="alert" className="border border-sale/40 bg-sale/5 p-5">
            <p className="font-medium text-sale">Some items in your cart have changed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">
              {problems.map((p) => (
                <li key={p.variantId}>{p.message}</li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-4" onClick={fixCart}>
              Update my cart
            </Button>
          </div>
        )}

        <section aria-labelledby="contact-h">
          <h2 id="contact-h" className="mb-5 text-lg">1. Contact details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
              <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message} hint="Used for order updates.">
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message} hint="e.g. 077 123 4567">
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="delivery-h">
          <h2 id="delivery-h" className="mb-5 text-lg">2. Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Address" htmlFor="addressLine" error={errors.addressLine?.message}>
              <Input id="addressLine" autoComplete="street-address" placeholder="House no, street, area" aria-invalid={!!errors.addressLine} {...register("addressLine")} />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} />
            </Field>
            <Field label="Order notes (optional)" htmlFor="notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="notes" rows={3} placeholder="Delivery instructions, gift message, etc." {...register("notes")} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="payment-h">
          <h2 id="payment-h" className="mb-5 text-lg">3. How would you like to order?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                value: "PAYHERE",
                icon: CreditCard,
                title: "Pay online",
                body: "Visa, Mastercard, Amex, eZ Cash or Genie, securely through PayHere.",
              },
              {
                value: "WHATSAPP",
                icon: MessageCircle,
                title: "Order via WhatsApp",
                body: "Send your order to our team on WhatsApp. Pay by bank transfer or cash on delivery.",
              },
            ].map((o) => (
              <label
                key={o.value}
                className={cn(
                  "flex cursor-pointer gap-3 border p-4 transition-colors",
                  paymentMethod === o.value ? "border-foreground bg-surface/60" : "hover:border-foreground/40",
                )}
              >
                <input type="radio" value={o.value} {...register("paymentMethod")} className="mt-1 h-4 w-4 accent-foreground" />
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    <o.icon className="h-4 w-4" strokeWidth={1.5} />
                    {o.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{o.body}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="summary-h">
        <div className="bg-surface p-6">
          <h2 id="summary-h" className="mb-5 text-lg">Order summary</h2>
          <ul className="-mx-2 max-h-96 space-y-4 overflow-y-auto px-2 pb-1 pt-2">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3">
                <div className="relative h-20 w-15 shrink-0 bg-white">
                  <Image src={l.image} alt="" fill sizes="60px" className="object-cover" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] text-white">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-[14px]">
                  <p className="truncate">{l.name}</p>
                  <p className="text-[13px] text-muted">
                    {l.colour} · {l.size}
                  </p>
                </div>
                <p className="text-[14px]">{formatPrice(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-black/10 pt-4 text-[14px]">
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
            <div className="flex justify-between border-t border-black/10 pt-3 text-[17px] font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(totals.total)}</dd>
            </div>
          </dl>

          <Button type="submit" size="lg" variant={paymentMethod === "WHATSAPP" ? "whatsapp" : "primary"} className="mt-6 w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {redirecting && paymentMethod === "PAYHERE" ? "Redirecting to PayHere…" : "Placing order…"}
              </>
            ) : paymentMethod === "WHATSAPP" ? (
              "Continue to WhatsApp"
            ) : (
              <>
                <Lock className="h-4 w-4" /> Pay {formatPrice(totals.total)}
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-[12px] text-muted">
            {paymentMethod === "WHATSAPP"
              ? "Your order is saved first, then you send it to us on WhatsApp."
              : "You'll be redirected to PayHere's secure page to pay."}
          </p>
        </div>
      </aside>
    </form>
  );
}
