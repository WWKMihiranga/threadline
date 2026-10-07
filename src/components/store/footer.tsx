import Link from "next/link";
import { env } from "@/lib/env";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";

export function Footer() {
  const wa = env().WHATSAPP_NUMBER;
  const waDisplay = `+${wa.slice(0, 2)} ${wa.slice(2, 4)} ${wa.slice(4, 7)} ${wa.slice(7)}`;

  return (
    <footer className="mt-24 border-t bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl tracking-[var(--tracking-logo)]">THREADLINE</p>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
            Modern, well-made clothing for everyday life. Designed and shipped from Colombo, Sri Lanka.
          </p>
        </div>

        <div>
          <p className="label mb-4 font-medium">Shop</p>
          <ul className="space-y-2.5 text-[14px] text-muted">
            <li><Link href="/shop?new=1" className="hover:text-foreground">New In</Link></li>
            <li><Link href="/shop?category=dresses" className="hover:text-foreground">Dresses</Link></li>
            <li><Link href="/shop?category=denim" className="hover:text-foreground">Denim</Link></li>
            <li><Link href="/shop?category=accessories" className="hover:text-foreground">Accessories</Link></li>
            <li><Link href="/shop?sale=1" className="hover:text-foreground">Sale</Link></li>
          </ul>
        </div>

        <div>
          <p className="label mb-4 font-medium">Help</p>
          <ul className="space-y-2.5 text-[14px] text-muted">
            <li><Link href="/track" className="hover:text-foreground">Track your order</Link></li>
            <li>Island-wide delivery in 2–4 working days</li>
            <li>Free delivery over {formatPrice(FREE_SHIPPING_THRESHOLD)}</li>
            <li>Bulk orders: 10% off 10+ pieces, 15% off 25+</li>
          </ul>
        </div>

        <div>
          <p className="label mb-4 font-medium">Contact</p>
          <ul className="space-y-2.5 text-[14px] text-muted">
            <li>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                WhatsApp {waDisplay}
              </a>
            </li>
            <li>hello@threadline.lk</li>
            <li>Mon–Sat, 9am – 6pm</li>
          </ul>
          <p className="label mt-6 mb-2 font-medium">Secure payments</p>
          <p className="text-[13px] text-muted">Visa · Mastercard · Amex · eZ Cash via PayHere</p>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-5 text-[12px] text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Threadline. A technical assessment project.</p>
          <p>Product photography from Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
