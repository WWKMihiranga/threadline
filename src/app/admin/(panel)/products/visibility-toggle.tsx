"use client";

import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setProductActive } from "./actions";

export function VisibilityToggle({ productId, isActive }: { productId: string; isActive: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(isActive);
  const [, startTransition] = useTransition();
  return (
    <button
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "Visible in store. Click to hide" : "Hidden. Click to show in store"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setProductActive(productId, !optimistic);
        })
      }
      className={cn("relative h-5 w-9 rounded-full transition-colors", optimistic ? "bg-success" : "bg-border")}
    >
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", optimistic ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}
