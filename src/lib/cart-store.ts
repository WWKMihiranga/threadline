"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

// The cart lives in the browser (localStorage) so guests can shop without an account.
// Prices here are for display only: the server re-reads every price and stock
// level from the database when the order is placed.

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  colour: string;
  unitPrice: number;
  stock: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  add: (items: CartLine[]) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(qty, stock, MAX_QTY_PER_LINE));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (items) =>
        set((state) => {
          const lines = [...state.lines];
          for (const item of items) {
            const existing = lines.find((l) => l.variantId === item.variantId);
            if (existing) {
              existing.quantity = clampQty(existing.quantity + item.quantity, item.stock);
              existing.stock = item.stock;
              existing.unitPrice = item.unitPrice;
            } else {
              lines.push({ ...item, quantity: clampQty(item.quantity, item.stock) });
            }
          }
          return { lines: lines.map((l) => ({ ...l })) };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: clampQty(quantity, l.stock) } : l)),
        })),
      remove: (variantId) => set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "threadline-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/** True after the persisted cart has loaded, to avoid server/client markup mismatches. */
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false, // server render: cart unknown
  );
}
