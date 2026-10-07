"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { BULK_TIERS, bulkPercentFor, MAX_QTY_PER_LINE } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { SIZES } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Variant = { id: string; size: string; colour: string; colourHex: string; stock: number };
type Product = { id: string; slug: string; name: string; price: number; image: string };

const sizeRank = (s: string) => {
  const i = (SIZES as readonly string[]).indexOf(s);
  return i === -1 ? 99 : i;
};

function stockLabel(stock: number) {
  if (stock <= 0) return { text: "Sold out", tone: "text-muted" };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: "text-sale" };
  return { text: "In stock", tone: "text-success" };
}

function Stepper({ value, max, onChange, label }: { value: number; max: number; onChange: (v: number) => void; label: string }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(v, max, MAX_QTY_PER_LINE)));
  return (
    <div className={cn("inline-flex items-center border", max <= 0 && "opacity-40")}>
      <button type="button" className="flex h-9 w-9 items-center justify-center hover:bg-surface disabled:opacity-30" onClick={() => set(value - 1)} disabled={value <= 0} aria-label={`Decrease ${label}`}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value || ""}
        placeholder="0"
        disabled={max <= 0}
        onChange={(e) => set(Math.floor(Number(e.target.value) || 0))}
        aria-label={label}
        className="h-9 w-12 border-x bg-transparent text-center text-[14px] outline-none placeholder:text-muted/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className="flex h-9 w-9 items-center justify-center hover:bg-surface disabled:opacity-30" onClick={() => set(value + 1)} disabled={value >= Math.min(max, MAX_QTY_PER_LINE)} aria-label={`Increase ${label}`}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ProductPurchase({ product, variants }: { product: Product; variants: Variant[] }) {
  const colours = useMemo(() => [...new Map(variants.map((v) => [v.colour, v.colourHex])).entries()], [variants]);
  const firstInStock = variants.find((v) => v.stock > 0);
  const [colour, setColour] = useState(firstInStock?.colour ?? colours[0]?.[0]);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [bulk, setBulk] = useState<Record<string, number>>({}); // variantId → quantity

  const cartQtyForProduct = useCart((s) => s.lines.filter((l) => l.productId === product.id).reduce((n, l) => n + l.quantity, 0));
  const addToCart = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const forColour = variants.filter((v) => v.colour === colour).sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  const selected = forColour.find((v) => v.size === size);
  const isOneSize = forColour.length === 1 && forColour[0].size === "Free Size";

  const bulkLines = variants.filter((v) => (bulk[v.id] ?? 0) > 0).map((v) => ({ variant: v, quantity: bulk[v.id] }));
  const pendingQty = mode === "bulk" ? bulkLines.reduce((n, l) => n + l.quantity, 0) : selected ? qty : 0;
  const pendingAmount = pendingQty * product.price;
  const percentAfter = bulkPercentFor(cartQtyForProduct + pendingQty);
  const nextTier = [...BULK_TIERS].reverse().find((t) => cartQtyForProduct + pendingQty < t.minQty);

  function add() {
    const lines =
      mode === "bulk"
        ? bulkLines
        : selected
          ? [{ variant: selected, quantity: qty }]
          : isOneSize
            ? [{ variant: forColour[0], quantity: qty }]
            : [];

    if (!lines.length) {
      toast.error(mode === "bulk" ? "Enter a quantity for at least one size." : "Please choose a size.");
      return;
    }

    addToCart(
      lines.map(({ variant, quantity }) => ({
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        size: variant.size,
        colour: variant.colour,
        unitPrice: product.price,
        stock: variant.stock,
        quantity,
      })),
    );
    const units = lines.reduce((n, l) => n + l.quantity, 0);
    toast.success(`Added ${units} ${units === 1 ? "item" : "items"} to your cart`);
    setBulk({});
    setQty(1);
    openCart();
  }

  // Summary of a bulk selection, grouped by colour: "Black — M × 10, L × 5"
  const bulkSummary = colours
    .map(([c]) => {
      const parts = bulkLines.filter((l) => l.variant.colour === c).sort((a, b) => sizeRank(a.variant.size) - sizeRank(b.variant.size));
      return parts.length ? `${c} — ${parts.map((p) => `${p.variant.size} × ${p.quantity}`).join(", ")}` : null;
    })
    .filter(Boolean);

  return (
    <div className="space-y-7">
      {/* Colour */}
      <fieldset>
        <legend className="mb-3 text-[14px]">
          Colour: <span className="font-medium">{colour}</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {colours.map(([name, hex]) => {
            const soldOut = variants.filter((v) => v.colour === name).every((v) => v.stock <= 0);
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setColour(name);
                  setSize(null);
                  setQty(1);
                }}
                aria-pressed={colour === name}
                aria-label={`${name}${soldOut ? " (sold out)" : ""}`}
                title={name}
                className={cn(
                  "relative h-9 w-9 rounded-full border border-black/15 transition",
                  colour === name && "ring-1 ring-foreground ring-offset-[3px]",
                  soldOut && "opacity-40",
                )}
                style={{ backgroundColor: hex }}
              >
                {soldOut && <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground/60" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Mode switch (only meaningful when there are several sizes) */}
      {!isOneSize && (
        <div role="tablist" aria-label="Order type" className="grid grid-cols-2 border text-[13px]">
          {(["single", "bulk"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("h-10 uppercase tracking-[0.08em] transition-colors", mode === m ? "bg-foreground text-white" : "hover:bg-surface")}
            >
              {m === "single" ? "One size" : "Multiple sizes"}
            </button>
          ))}
        </div>
      )}

      {mode === "single" || isOneSize ? (
        <>
          {!isOneSize && (
            <fieldset>
              <legend className="mb-3 flex w-full justify-between text-[14px]">
                <span>
                  Size{selected && <>: <span className="font-medium">{selected.size}</span></>}
                </span>
                {selected && <span className={cn("text-[13px]", stockLabel(selected.stock).tone)}>{stockLabel(selected.stock).text}</span>}
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {forColour.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.stock <= 0}
                    onClick={() => {
                      setSize(v.size);
                      setQty((q) => Math.min(q, v.stock));
                    }}
                    aria-pressed={size === v.size}
                    aria-label={`Size ${v.size}${v.stock <= 0 ? ", sold out" : ""}`}
                    className={cn(
                      "h-11 border text-[14px] transition-colors",
                      size === v.size ? "border-foreground bg-foreground text-white" : "hover:border-foreground",
                      v.stock <= 0 && "cursor-not-allowed text-muted line-through opacity-50 hover:border-border",
                    )}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {isOneSize && (
            <p className={cn("text-[13px]", stockLabel(forColour[0].stock).tone)}>{stockLabel(forColour[0].stock).text}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[14px]">Quantity</span>
            <Stepper
              value={qty}
              max={(selected ?? (isOneSize ? forColour[0] : undefined))?.stock ?? MAX_QTY_PER_LINE}
              onChange={(v) => setQty(Math.max(1, v))}
              label="quantity"
            />
          </div>
        </>
      ) : (
        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="text-[14px]">
              Quantities for <span className="font-medium">{colour}</span>
            </p>
            <p className="text-[12px] text-muted">Switch colour to add more</p>
          </div>
          <table className="w-full text-[14px]">
            <thead className="sr-only">
              <tr>
                <th>Size</th>
                <th>Availability</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y border-y">
              {forColour.map((v) => {
                const s = stockLabel(v.stock);
                return (
                  <tr key={v.id}>
                    <td className="w-14 py-2.5 font-medium">{v.size}</td>
                    <td className={cn("py-2.5 text-[13px]", s.tone)}>{s.text}</td>
                    <td className="py-2.5 text-right">
                      <Stepper value={bulk[v.id] ?? 0} max={v.stock} onChange={(q) => setBulk((b) => ({ ...b, [v.id]: q }))} label={`quantity for ${colour} size ${v.size}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bulkSummary.length > 0 && (
            <div className="mt-4 bg-surface p-4 text-[13px]">
              <p className="label mb-2 font-medium">Your selection</p>
              <ul className="space-y-1">
                {bulkSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bulk discount nudge */}
      <div className="border-l-2 border-accent bg-accent/8 px-4 py-3 text-[13px]">
        {percentAfter > 0 ? (
          <p>
            <span className="font-medium">{percentAfter}% bulk discount</span> applies to this style at checkout.
            {nextTier && ` Add ${nextTier.minQty - cartQtyForProduct - pendingQty} more for ${nextTier.percent}% off.`}
          </p>
        ) : (
          <p>
            Buying for a team? <span className="font-medium">10% off 10+ pieces</span> of this style, 15% off 25+, mixed sizes and colours.
          </p>
        )}
      </div>

      <Button size="lg" className="w-full" onClick={add} disabled={variants.every((v) => v.stock <= 0)}>
        {variants.every((v) => v.stock <= 0)
          ? "Sold out"
          : pendingQty > 1
            ? `Add ${pendingQty} to cart · ${formatPrice(pendingAmount)}`
            : "Add to cart"}
      </Button>
    </div>
  );
}
