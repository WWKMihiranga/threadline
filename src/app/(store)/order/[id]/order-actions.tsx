"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PayHereCheckout } from "@/lib/payhere";

/**
 * PayHere redirects the customer back (return_url) at roughly the same time it calls
 * our notify endpoint, so the order may still be unpaid for a few seconds. Re-fetch the
 * server component a few times rather than trusting the redirect itself.
 */
export function PaymentPoller({ maxAttempts = 10 }: { maxAttempts?: number }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= maxAttempts) return;
    const t = setTimeout(() => {
      router.refresh();
      setAttempts((a) => a + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [attempts, maxAttempts, router]);

  if (attempts >= maxAttempts) {
    return (
      <p className="text-[14px] text-muted">
        Still waiting for confirmation from PayHere. If you completed the payment, it will show here shortly. You can refresh this page.
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-[14px] text-muted" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment with PayHere…
    </p>
  );
}

export function RetryPaymentButton({ checkout, label = "Pay now" }: { checkout: PayHereCheckout; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form method="POST" action={checkout.action} onSubmit={() => setBusy(true)}>
      {Object.entries(checkout.fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {label}
      </Button>
    </form>
  );
}
