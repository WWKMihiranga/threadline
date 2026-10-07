"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { SORTS, type SortKey } from "@/lib/shop-filters";
import { SIZES } from "@/lib/validations";
import { cn } from "@/lib/utils";

type Options = {
  categories: { slug: string; name: string }[];
  colours: { name: string; hex: string }[];
};

/** Returns a function that patches the URL query (removing empty keys) and resets to page 1. */
function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    if (!("page" in patch)) params.delete("page");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return { update, searchParams, pending };
}

function toggleInList(current: string | null, value: string) {
  const set = new Set((current ?? "").split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set].join(",") || null;
}

function FilterPanel({ categories, colours }: Options) {
  const { update, searchParams } = useQueryUpdater();
  const activeCategory = searchParams.get("category");
  const sizes = (searchParams.get("size") ?? "").split(",").filter(Boolean);
  const activeColours = (searchParams.get("colour") ?? "").split(",").filter(Boolean).map((c) => c.toLowerCase());

  function applyPrice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update({ min: String(fd.get("min") ?? ""), max: String(fd.get("max") ?? "") });
  }

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="label mb-3 font-medium">Category</legend>
        <ul className="space-y-2 text-[14px]">
          <li>
            <button onClick={() => update({ category: null })} className={cn("hover:text-foreground", !activeCategory ? "font-medium text-foreground" : "text-muted")}>
              All products
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => update({ category: c.slug })}
                aria-current={activeCategory === c.slug}
                className={cn("hover:text-foreground", activeCategory === c.slug ? "font-medium text-foreground" : "text-muted")}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 font-medium">Size</legend>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => update({ size: toggleInList(searchParams.get("size"), s) })}
              aria-pressed={sizes.includes(s)}
              className={cn(
                "h-9 min-w-11 border px-2.5 text-[13px] transition-colors",
                sizes.includes(s) ? "border-foreground bg-foreground text-white" : "hover:border-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 font-medium">Colour</legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {colours.map((c) => {
            const on = activeColours.includes(c.name.toLowerCase());
            return (
              <button
                key={c.name}
                onClick={() => update({ colour: toggleInList(searchParams.get("colour"), c.name) })}
                aria-pressed={on}
                className={cn("flex items-center gap-2 text-left text-[14px]", on ? "text-foreground" : "text-muted hover:text-foreground")}
              >
                <span
                  className={cn("h-4 w-4 shrink-0 rounded-full border border-black/15", on && "ring-1 ring-foreground ring-offset-2")}
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 font-medium">Price (Rs)</legend>
        <form onSubmit={applyPrice} className="flex items-center gap-2" key={`${searchParams.get("min")}-${searchParams.get("max")}`}>
          <input name="min" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={searchParams.get("min") ?? ""} aria-label="Minimum price" className="h-10 w-full min-w-0 border px-2.5 outline-none focus:border-foreground" />
          <span className="text-muted">–</span>
          <input name="max" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={searchParams.get("max") ?? ""} aria-label="Maximum price" className="h-10 w-full min-w-0 border px-2.5 outline-none focus:border-foreground" />
          <Button type="submit" variant="outline" size="sm" className="h-10 px-3">
            Go
          </Button>
        </form>
      </fieldset>

      <fieldset className="space-y-3 text-[14px]">
        <legend className="label mb-3 font-medium">Show only</legend>
        {[
          { key: "new", label: "New arrivals" },
          { key: "sale", label: "On sale" },
        ].map((t) => (
          <label key={t.key} className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={searchParams.get(t.key) === "1"}
              onChange={(e) => update({ [t.key]: e.target.checked ? "1" : null })}
              className="h-4 w-4 accent-foreground"
            />
            {t.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export function FilterSidebar(props: Options) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block" aria-label="Filters">
      <FilterPanel {...props} />
    </aside>
  );
}

export function ShopToolbar({ activeCount, total, ...options }: Options & { activeCount: number; total: number }) {
  const { update, searchParams, pending } = useQueryUpdater();
  const [open, setOpen] = useState(false);
  const sort = (searchParams.get("sort") ?? "newest") as SortKey;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-[14px] lg:hidden">
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
        Filters{activeCount > 0 && ` (${activeCount})`}
      </button>
      <p className={cn("hidden text-[14px] text-muted transition-opacity lg:block", pending && "opacity-50")} aria-live="polite">
        {total} {total === 1 ? "product" : "products"}
      </p>
      <label className="flex items-center gap-2 text-[14px]">
        <span className="hidden text-muted sm:inline">Sort by</span>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="h-9 cursor-pointer border-0 bg-transparent pr-1 text-[14px] font-medium outline-none"
          aria-label="Sort products"
        >
          {Object.entries(SORTS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title="Filters"
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show {total} {total === 1 ? "product" : "products"}
          </Button>
        }
      >
        <div className="p-5">
          <FilterPanel {...options} />
        </div>
      </Drawer>
    </div>
  );
}

export function ActiveFilterChips({ colours }: { colours: { name: string }[] }) {
  const { update, searchParams } = useQueryUpdater();
  const chips: { label: string; patch: Record<string, string | null> }[] = [];

  for (const s of (searchParams.get("size") ?? "").split(",").filter(Boolean)) {
    chips.push({ label: `Size ${s}`, patch: { size: toggleInList(searchParams.get("size"), s) } });
  }
  for (const c of (searchParams.get("colour") ?? "").split(",").filter(Boolean)) {
    const name = colours.find((o) => o.name.toLowerCase() === c.toLowerCase())?.name ?? c;
    chips.push({ label: name, patch: { colour: toggleInList(searchParams.get("colour"), c) } });
  }
  if (searchParams.get("min")) chips.push({ label: `From Rs ${searchParams.get("min")}`, patch: { min: null } });
  if (searchParams.get("max")) chips.push({ label: `Up to Rs ${searchParams.get("max")}`, patch: { max: null } });
  if (searchParams.get("new") === "1") chips.push({ label: "New arrivals", patch: { new: null } });
  if (searchParams.get("sale") === "1") chips.push({ label: "On sale", patch: { sale: null } });
  if (searchParams.get("q")) chips.push({ label: `“${searchParams.get("q")}”`, patch: { q: null } });

  if (!chips.length) return null;
  const clearAll = Object.fromEntries(["size", "colour", "min", "max", "new", "sale", "q"].map((k) => [k, null]));

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button key={chip.label} onClick={() => update(chip.patch)} className="flex h-8 items-center gap-1.5 bg-surface px-3 text-[13px] hover:bg-border" aria-label={`Remove filter ${chip.label}`}>
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      <button onClick={() => update(clearAll)} className="ml-1 text-[13px] text-muted underline underline-offset-4 hover:text-foreground">
        Clear all
      </button>
    </div>
  );
}

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const searchParams = useSearchParams();
  if (pages <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) params.delete("page");
    else params.set("page", String(p));
    return `/shop?${params.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn("flex h-10 w-10 items-center justify-center text-[14px]", p === page ? "bg-foreground text-white" : "hover:bg-surface")}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
