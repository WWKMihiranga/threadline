import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ImageTile } from "@/components/store/image-tile";
import { NewArrivals } from "@/components/store/new-arrivals";
import { getCategories, getNewArrivals } from "@/lib/queries";

// Rebuilt at most once a minute; admin changes also revalidate it immediately.
export const revalidate = 60;

const img = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export default async function HomePage() {
  const [products, categories] = await Promise.all([getNewArrivals(8), getCategories()]);
  const tabSlugs = new Set(products.map((p) => p.category.slug));
  const tabs = categories.filter((c) => tabSlugs.has(c.slug)).map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <>
      {/* Hero: sits under the transparent header */}
      <section className="relative -mt-16 h-[88svh] min-h-[560px] w-full overflow-hidden bg-accent">
        <Image
          src={img("1728280050425-ba1695a9c9a6", 2400)}
          alt="Model in a white dress under an open sky"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
        <div className="container-page relative flex h-full flex-col justify-end pb-16 text-white md:justify-center md:pb-0">
          <p className="label mb-4">New season · 2026</p>
          <h1 className="max-w-[12ch] text-[2.6rem] leading-[1.05] md:text-6xl">Wear it well.</h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/90">
            Considered everyday pieces in natural fabrics, made for the way you really live.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop?new=1" className={buttonVariants({ variant: "light", size: "lg" })}>
              Shop the collection
            </Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-page py-16 md:py-20" aria-labelledby="new-in">
        <h2 id="new-in" className="section-title mb-6">
          New In
        </h2>
        <NewArrivals products={products} tabs={tabs} />
        <div className="mt-10 text-center">
          <Link href="/shop?new=1" className={buttonVariants({ variant: "outline" })}>
            View all new arrivals
          </Link>
        </div>
      </section>

      {/* Bento category grid */}
      <section className="container-page" aria-label="Shop by category">
        <div className="grid gap-3 md:h-[680px] md:grid-cols-4 md:grid-rows-2">
          <ImageTile
            href="/shop?category=knitwear"
            image={img("1626854586365-94312f94c8e5", 1400)}
            title={<>Soft<br />Knitwear</>}
            subtitle="Easy layers for cool evenings."
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/5] md:col-span-2 md:row-span-2 md:aspect-auto"
            big
          />
          <ImageTile
            href="/shop?sale=1"
            image={img("1697663426683-530277eb4fbd", 1400)}
            title={<>Up to 30% off</>}
            subtitle="Selected pieces from last season."
            cta="Shop the sale"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/3] md:order-last md:col-span-2 md:aspect-auto"
            big
          />
          <ImageTile
            href="/shop?category=dresses"
            image={img("1586024795129-38d4e68bdd0c", 900)}
            title="Dresses"
            subtitle="From desk to dinner."
            sizes="(min-width: 768px) 25vw, 100vw"
            className="aspect-[4/3] md:aspect-auto"
          />
          <ImageTile
            href="/shop?category=accessories"
            image={img("1760624294582-5341f33f9fa4", 900)}
            title="Accessories"
            subtitle="Details that finish the look."
            sizes="(min-width: 768px) 25vw, 100vw"
            className="aspect-[4/3] md:aspect-auto"
          />
        </div>
      </section>

      {/* Capsule row */}
      <section className="container-page py-16 md:py-20" aria-labelledby="capsule">
        <h2 id="capsule" className="section-title mb-8">
          The Everyday Capsule
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {[
            { title: "Crisp Shirts", sub: "Always right", href: "/shop?category=shirts", id: "1600219823854-f3bfee26ea9c" },
            { title: "Easy Denim", sub: "Built to last", href: "/shop?category=denim", id: "1577660002965-04865592fc60" },
            { title: "Outerwear", sub: "Monsoon-ready", href: "/shop?category=outerwear", id: "1788120680424-60c0069f9e61" },
            { title: "The Black Dress", sub: "Never wrong", href: "/shop?category=dresses", id: "1522218296581-1244648997fb" },
          ].map((c) => (
            <ImageTile
              key={c.title}
              href={c.href}
              image={img(c.id, 800)}
              title={c.title}
              subtitle={c.sub}
              cta="Explore"
              sizes="(min-width: 768px) 25vw, 50vw"
              className="aspect-[3/4]"
            />
          ))}
        </div>
      </section>

      {/* Bulk order banner: speaks directly to the "larger quantity orders" requirement */}
      <section className="container-page">
        <div className="flex flex-col items-start gap-6 bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <p className="label mb-3 text-muted">Teams, events & resellers</p>
            <h2 className="text-2xl md:text-3xl">Ordering in bulk?</h2>
            <p className="mt-3 max-w-lg text-[15px] text-muted">
              Pick quantities for every size in one go. Get 10% off 10+ pieces of a style and 15% off 25+, applied automatically.
            </p>
          </div>
          <Link href="/product/oversized-t-shirt" className={buttonVariants({ size: "lg" })}>
            Try the size grid
          </Link>
        </div>
      </section>
    </>
  );
}
