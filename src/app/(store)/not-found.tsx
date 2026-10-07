import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <p className="label text-muted">404</p>
      <h1 className="mt-3 text-3xl">Page not found</h1>
      <p className="mt-3 max-w-sm text-[15px] text-muted">The page you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
      <Link href="/shop" className={`${buttonVariants({ variant: "outline" })} mt-8`}>
        Continue shopping
      </Link>
    </div>
  );
}
