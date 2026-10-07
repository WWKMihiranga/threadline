import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, RotateCcw, MessageCircle } from "lucide-react";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ProductCard } from "@/components/store/product-card";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId);
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const savePercent = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;

  return (
    <div className="container-page pt-6 md:pt-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>{" "}
        <span aria-hidden>/</span> <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="md:sticky md:top-24 md:self-start">
          {product.isNew && <p className="label mb-3 text-muted">New arrival</p>}
          <h1 className="text-2xl leading-tight md:text-3xl">{product.name}</h1>
          <p className="mt-3 flex items-baseline gap-3 text-xl">
            <span className={onSale ? "text-sale" : undefined}>{formatPrice(product.price)}</span>
            {onSale && (
              <>
                <span className="text-[15px] text-muted line-through">{formatPrice(product.compareAtPrice!)}</span>
                <span className="label bg-sale px-2 py-0.5 text-white">−{savePercent}%</span>
              </>
            )}
          </p>

          <p className="mt-6 text-[15px] leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8">
            <ProductPurchase
              product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0] }}
              variants={product.variants.map((v) => ({ id: v.id, size: v.size, colour: v.colour, colourHex: v.colourHex, stock: v.stock }))}
            />
          </div>

          <ul className="mt-8 space-y-3 border-t pt-6 text-[14px] text-muted">
            <li className="flex gap-3">
              <Truck className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              Island-wide delivery in 2–4 working days. Free over {formatPrice(FREE_SHIPPING_THRESHOLD)}.
            </li>
            <li className="flex gap-3">
              <RotateCcw className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              Exchange unworn items within 7 days.
            </li>
            <li className="flex gap-3">
              <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              Prefer to chat? Choose “Order via WhatsApp” at checkout.
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related">
          <h2 id="related" className="section-title mb-8">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
