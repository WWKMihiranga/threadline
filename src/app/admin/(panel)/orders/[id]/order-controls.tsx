"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markWhatsAppOrderPaid, updateOrderStatus, type ActionResult } from "../actions";

const LABELS: Record<string, { label: string; hint: string; variant?: "primary" | "outline" | "danger" }> = {
  CONFIRMED: { label: "Confirm order", hint: "Deducts the items from stock." },
  PROCESSING: { label: "Mark as packing", hint: "The order is being prepared." },
  SHIPPED: { label: "Mark as shipped", hint: "Handed to the courier." },
  DELIVERED: { label: "Mark as delivered", hint: "The customer has the order." },
  CANCELLED: { label: "Cancel order", hint: "Returns any deducted stock.", variant: "danger" },
};

export function OrderControls({
  orderId,
  next,
  canMarkPaid,
  blockedReason,
}: {
  orderId: string;
  next: string[];
  canMarkPaid: boolean;
  blockedReason?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  function run(key: string, fn: () => Promise<ActionResult>) {
    setRunning(key);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message);
      else toast.error(res.error, { duration: 8000 });
      setRunning(null);
      setConfirmCancel(false);
    });
  }

  const forward = next.filter((s) => s !== "CANCELLED");

  if (next.length === 0 && !canMarkPaid) {
    return <p className="text-[14px] text-muted">This order is closed. No further changes are possible.</p>;
  }

  return (
    <div className="space-y-4">
      {blockedReason && <p className="bg-amber-50 px-3 py-2 text-[13px] text-amber-800">{blockedReason}</p>}

      {forward.map((s) => (
        <div key={s}>
          <Button className="w-full" disabled={pending} onClick={() => run(s, () => updateOrderStatus(orderId, s))}>
            {running === s && <Loader2 className="h-4 w-4 animate-spin" />}
            {LABELS[s].label}
          </Button>
          <p className="mt-1.5 text-[12px] text-muted">{LABELS[s].hint}</p>
        </div>
      ))}

      {canMarkPaid && (
        <div>
          <Button variant="outline" className="w-full" disabled={pending} onClick={() => run("paid", () => markWhatsAppOrderPaid(orderId))}>
            {running === "paid" && <Loader2 className="h-4 w-4 animate-spin" />}
            Record payment received
          </Button>
          <p className="mt-1.5 text-[12px] text-muted">Bank transfer or cash on delivery collected.</p>
        </div>
      )}

      {next.includes("CANCELLED") &&
        (confirmCancel ? (
          <div className="border border-sale/40 bg-sale/5 p-3">
            <p className="mb-3 text-[13px]">Cancel this order? {LABELS.CANCELLED.hint}</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" disabled={pending} onClick={() => run("CANCELLED", () => updateOrderStatus(orderId, "CANCELLED"))}>
                {running === "CANCELLED" && <Loader2 className="h-4 w-4 animate-spin" />} Yes, cancel
              </Button>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => setConfirmCancel(false)}>
                Keep order
              </Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmCancel(true)} className="text-[13px] text-sale underline-offset-4 hover:underline" disabled={pending}>
            Cancel order
          </button>
        ))}
    </div>
  );
}
