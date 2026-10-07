import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority = false, className }: { product: ProductCardData; priority?: boolean; className?: string }) {
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const colours = [...new Map(product.variants.map((v) => [v.colour, v.colourHex])).entries()];

  return (
    <Link href={`/product/${product.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
          className={cn(
            "object-cover transition-opacity duration-500",
            product.images[1] && "group-hover:opacity-0",
            soldOut && "opacity-60",
          )}
        />
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {soldOut ? (
            <span className="label bg-white px-2 py-1 font-medium">Sold out</span>
          ) : (
            <>
              {product.isNew && <span className="label bg-white px-2 py-1 font-medium">New</span>}
              {onSale && <span className="label bg-sale px-2 py-1 font-medium text-white">Sale</span>}
            </>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-sans text-[14px] normal-case tracking-normal">{product.name}</h3>
        {colours.length > 1 && (
          <div className="flex shrink-0 gap-1 pt-1" aria-label={`${colours.length} colours`}>
            {colours.slice(0, 4).map(([name, hex]) => (
              <span key={name} title={name} className="h-2.5 w-2.5 rounded-full border border-black/15" style={{ backgroundColor: hex }} />
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-[14px]">
        <span className={cn("font-semibold", onSale && "text-sale")}>{formatPrice(product.price)}</span>
        {onSale && <span className="ml-2 text-muted line-through">{formatPrice(product.compareAtPrice!)}</span>}
      </p>
    </Link>
  );
}
