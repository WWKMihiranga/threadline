"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateStock } from "./actions";

export function StockCell({ variantId, stock, label }: { variantId: string; stock: number; label: string }) {
  const [value, setValue] = useState(String(stock));
  const [saved, setSaved] = useState(stock);
  const [pending, startTransition] = useTransition();
  const dirty = value !== String(saved);

  function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!dirty) return;
    const n = Number(value);
    startTransition(async () => {
      const res = await updateStock(variantId, n);
      if (res.ok) {
        setSaved(n);
        toast.success(`${label}: stock set to ${n}`);
      } else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={save} className="flex items-center justify-end gap-1.5">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Stock for ${label}`}
        className={cn(
          "h-9 w-20 border px-2 text-right text-[14px] outline-none focus:border-foreground",
          saved === 0 && !dirty && "text-sale",
          dirty && "border-amber-400",
        )}
      />
      <button
        type="submit"
        disabled={!dirty || pending}
        aria-label="Save stock"
        className={cn("flex h-9 w-9 items-center justify-center border", dirty ? "border-foreground bg-foreground text-white" : "invisible")}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
    </form>
  );
}
