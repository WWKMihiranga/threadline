import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">
        Skip to content
      </a>
      <Header />
      <CartDrawer />
      <main id="main" className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
