import { SIZES } from "@/lib/validations";

// Shop filters live in the URL (/shop?category=denim&size=M&sort=price-asc), so every
// filtered view can be shared, bookmarked and navigated with the back button.

export const SORTS = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name A–Z",
} as const;
export type SortKey = keyof typeof SORTS;

export const PAGE_SIZE = 12;

export type ShopFilters = {
  q?: string;
  category?: string;
  sizes: string[];
  colours: string[];
  min?: number;
  max?: number;
  sale: boolean;
  isNew: boolean;
  sort: SortKey;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

export function parseShopFilters(params: Params): ShopFilters {
  const sort = one(params.sort);
  return {
    q: one(params.q)?.slice(0, 80),
    category: one(params.category)?.slice(0, 60),
    sizes: list(params.size).filter((s): s is (typeof SIZES)[number] => (SIZES as readonly string[]).includes(s)),
    colours: list(params.colour).slice(0, 10).map((c) => c.slice(0, 30)),
    min: num(params.min),
    max: num(params.max),
    sale: one(params.sale) === "1",
    isNew: one(params.new) === "1",
    sort: sort && sort in SORTS ? (sort as SortKey) : "newest",
    page: Math.max(1, num(params.page) ?? 1),
  };
}

export function countActiveFilters(f: ShopFilters) {
  return f.sizes.length + f.colours.length + (f.min !== undefined ? 1 : 0) + (f.max !== undefined ? 1 : 0) + (f.sale ? 1 : 0) + (f.isNew ? 1 : 0);
}
