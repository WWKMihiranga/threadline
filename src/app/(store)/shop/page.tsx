import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { ActiveFilterChips, FilterSidebar, Pagination, ShopToolbar } from "@/components/store/shop-filters";
import { buttonVariants } from "@/components/ui/button";
import { getCategories, getColourOptions, getShopProducts } from "@/lib/queries";
import { countActiveFilters, parseShopFilters } from "@/lib/shop-filters";

export async function generateMetadata(props: PageProps<"/shop">): Promise<Metadata> {
  const f = parseShopFilters(await props.searchParams);
  if (f.q) return { title: `Search: ${f.q}` };
  if (f.category) {
    const categories = await getCategories();
    const c = categories.find((x) => x.slug === f.category);
    if (c) return { title: c.name };
  }
  return { title: f.sale ? "Sale" : f.isNew ? "New In" : "Shop All" };
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const filters = parseShopFilters(await props.searchParams);
  const [{ products, total, pages }, categories, colours] = await Promise.all([
    getShopProducts(filters),
    getCategories(),
    getColourOptions(),
  ]);

  const category = categories.find((c) => c.slug === filters.category);
  const title = filters.q ? `Results for “${filters.q}”` : category?.name ?? (filters.sale ? "Sale" : filters.isNew ? "New In" : "Shop All");
  const options = { categories: categories.map((c) => ({ slug: c.slug, name: c.name })), colours };

  return (
    <div className="container-page pb-8 pt-10 md:pt-14">
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span>{" "}
        {category ? (
          <>
            <Link href="/shop" className="hover:text-foreground">Shop</Link> <span aria-hidden>/</span> {category.name}
          </>
        ) : (
          "Shop"
        )}
      </nav>
      <h1 className="mb-8 text-3xl md:text-4xl">{title}</h1>

      <div className="flex gap-12">
        <FilterSidebar {...options} />

        <div className="min-w-0 flex-1">
          <ShopToolbar {...options} total={total} activeCount={countActiveFilters(filters)} />
          <ActiveFilterChips colours={colours} />

          {products.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:gap-x-5">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 bg-surface px-6 py-20 text-center">
              <p className="font-display text-xl uppercase tracking-wide">No products found</p>
              <p className="max-w-sm text-[14px] text-muted">
                Try removing a filter or searching for something broader, like “shirt” or “black”.
              </p>
              <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
                View all products
              </Link>
            </div>
          )}

          <Pagination page={filters.page} pages={pages} />
        </div>
      </div>
    </div>
  );
}
