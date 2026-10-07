"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Boxes, ExternalLink, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Tags } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { logout } from "@/app/admin/(auth)/login/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: Tags },
];

function NavLinks({ pendingOrders, onNavigate }: { pendingOrders: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[14px] transition-colors",
                active ? "bg-foreground text-white" : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              <l.icon className="h-4 w-4" strokeWidth={1.75} />
              {l.label}
              {l.href === "/admin/orders" && pendingOrders > 0 && (
                <span className={cn("ml-auto rounded-full px-2 text-[11px] font-semibold", active ? "bg-white text-foreground" : "bg-sale text-white")}>
                  {pendingOrders}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <div className="space-y-1 border-t pt-4">
      <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 text-[14px] text-muted hover:text-foreground">
        <ExternalLink className="h-4 w-4" strokeWidth={1.75} /> View store
      </Link>
      <form action={logout}>
        <button className="flex w-full items-center gap-3 px-3 py-2 text-[14px] text-muted hover:text-foreground">
          <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-[12px] text-muted" title={email}>
        {email}
      </p>
    </div>
  );
}

export function AdminNav({ email, pendingOrders }: { email: string; pendingOrders: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-white p-4 lg:flex">
        <Link href="/admin" className="mb-8 px-3 pt-2">
          <span className="block font-display text-lg tracking-[var(--tracking-logo)]">THREADLINE</span>
          <span className="label text-muted">Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex-1">
          <NavLinks pendingOrders={pendingOrders} />
        </nav>
        <Footer email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="-ml-2 p-2">
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <span className="font-display tracking-[var(--tracking-logo)]">THREADLINE</span>
        <span className="w-9" />
      </header>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Admin">
        <div className="flex h-full flex-col p-4">
          <nav aria-label="Admin mobile" className="flex-1">
            <NavLinks pendingOrders={pendingOrders} onNavigate={() => setOpen(false)} />
          </nav>
          <Footer email={email} />
        </div>
      </Drawer>
    </>
  );
}
