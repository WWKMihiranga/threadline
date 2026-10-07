import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader title="New product" />
      <ProductForm categories={categories} />
    </>
  );
}
