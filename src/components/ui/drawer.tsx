"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Accessible slide-in panel built on the native <dialog> element:
// focus trapping, Escape to close and inert background come for free.
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        "m-0 h-dvh max-h-dvh w-full max-w-[420px] bg-white p-0 text-foreground backdrop:bg-black/40",
        side === "right" ? "ml-auto" : "mr-auto",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <h2 className="text-base tracking-[0.12em]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="-mr-2 p-2 hover:opacity-60">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t p-5">{footer}</div>}
      </div>
    </dialog>
  );
}
