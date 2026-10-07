"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="hidden flex-col gap-3 md:flex" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              role="tab"
              aria-selected={active === i}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn("relative h-24 w-[72px] bg-surface", active === i ? "ring-1 ring-foreground" : "opacity-70 hover:opacity-100")}
            >
              <Image src={src} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Desktop: main image. Mobile: swipeable strip */}
      <div className="relative hidden aspect-[3/4] min-w-0 flex-1 bg-surface md:block">
        <Image src={images[active]} alt={name} fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto md:hidden">
        {images.map((src, i) => (
          <div key={src} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-surface">
            <Image src={src} alt={i === 0 ? name : `${name}, view ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
            {images.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-white/90 px-2 py-0.5 text-[12px]">
                {i + 1} / {images.length}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
