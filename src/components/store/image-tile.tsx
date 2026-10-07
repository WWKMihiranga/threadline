import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Editorial category tile: image with a gradient so overlaid text stays readable (WCAG contrast).
export function ImageTile({
  href,
  image,
  title,
  subtitle,
  cta = "Shop now",
  className,
  sizes,
  big,
}: {
  href: string;
  image: string;
  title: React.ReactNode;
  subtitle?: string;
  cta?: string;
  className?: string;
  sizes: string;
  big?: boolean;
}) {
  return (
    <Link href={href} className={cn("group relative block overflow-hidden bg-surface", className)}>
      <Image src={image} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
        <h3 className={cn("leading-tight", big ? "text-3xl md:text-4xl" : "text-xl md:text-2xl")}>{title}</h3>
        {subtitle && <p className="mt-2 max-w-[22ch] text-[14px] text-white/85">{subtitle}</p>}
        <span className="mt-4 inline-flex items-center gap-3 text-[13px] tracking-wide">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  );
}
