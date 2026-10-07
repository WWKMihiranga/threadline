"use client";

import { useState } from "react";
import { ProductCard } from "@/components/store/product-card";
import type { ProductCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Item = ProductCardData & { category: { slug: string } };

export function NewArrivals({ products, tabs }: { products: Item[]; tabs: { slug: string; name: string }[] }) {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? products : products.filter((p) => p.category.slug === active);

  return (
    <div>
      <div role="tablist" aria-label="Filter new arrivals" className="no-scrollbar mb-8 flex justify-start gap-6 overflow-x-auto px-1 sm:justify-center">
        {[{ slug: "all", name: "All" }, ...tabs].map((t) => (
          <button
            key={t.slug}
            role="tab"
            aria-selected={active === t.slug}
            onClick={() => setActive(t.slug)}
            className={cn(
              "shrink-0 border-b pb-1.5 text-[14px] transition-colors",
              active === t.slug ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Horizontal swipe row on mobile (the half-visible card hints there's more), grid on desktop */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
        {visible.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 2} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto" />
        ))}
        {visible.length === 0 && <p className="w-full py-10 text-center text-muted md:col-span-4">New pieces in this category are coming soon.</p>}
      </div>
    </div>
  );
}
