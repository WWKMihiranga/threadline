"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, PackageSearch, X } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?new=1", label: "New In" },
  { href: "/shop?category=dresses", label: "Dresses" },
  { href: "/shop?category=denim", label: "Denim" },
  { href: "/shop?sale=1", label: "Sale" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const hydrated = useCartHydrated();
  const count = useCart((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));
  const openCart = useCart((s) => s.open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Transparent over the home hero, solid everywhere else (and once scrolled).
  const transparent = isHome && !scrolled && !searchOpen;

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  const iconClass = "h-[20px] w-[20px]";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
          transparent ? "bg-transparent text-white" : "border-b bg-white/95 text-foreground backdrop-blur",
        )}
      >
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: menu (mobile) / nav (desktop) */}
          <div className="flex items-center">
            <button
              className="-ml-2 p-2 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className={iconClass} strokeWidth={1.5} />
            </button>
            <nav aria-label="Main" className="hidden gap-7 lg:flex">
              {NAV_LINKS.map((l) => (
                <Link key={l.label} href={l.href} className="text-[13px] tracking-wide hover:opacity-60">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Centre: logo */}
          <Link href="/" className="font-display text-xl tracking-[var(--tracking-logo)] md:text-2xl" aria-label="Threadline home">
            THREADLINE
          </Link>

          {/* Right: actions */}
          <div className="-mr-2 flex items-center justify-end">
            <button className="p-2 hover:opacity-60" onClick={() => setSearchOpen((v) => !v)} aria-label="Search products">
              {searchOpen ? <X className={iconClass} strokeWidth={1.5} /> : <Search className={iconClass} strokeWidth={1.5} />}
            </button>
            <Link href="/track" className="hidden p-2 hover:opacity-60 sm:block" aria-label="Track your order">
              <PackageSearch className={iconClass} strokeWidth={1.5} />
            </Link>
            <button className="relative p-2 hover:opacity-60" onClick={openCart} aria-label={`Open cart, ${count} items`}>
              <ShoppingBag className={iconClass} strokeWidth={1.5} />
              {hydrated && count > 0 && (
                <span
                  className={cn(
                    "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    transparent ? "bg-white text-foreground" : "bg-foreground text-white",
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t bg-white text-foreground">
            <form onSubmit={submitSearch} role="search" className="container-page flex h-16 items-center gap-3">
              <Search className="h-5 w-5 text-muted" strokeWidth={1.5} />
              <input
                ref={searchRef}
                name="q"
                type="search"
                placeholder="Search for dresses, denim, tees…"
                aria-label="Search products"
                className="h-full flex-1 bg-transparent outline-none placeholder:text-muted"
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
            </form>
          </div>
        )}
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menu">
        <nav aria-label="Mobile" className="flex flex-col p-5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="border-b py-4 font-display text-lg uppercase tracking-[0.08em]"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/track" onClick={() => setMenuOpen(false)} className="py-4 text-[15px] text-muted">
            Track your order
          </Link>
        </nav>
      </Drawer>
    </>
  );
}
