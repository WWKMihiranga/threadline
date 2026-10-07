import { Card, PageHeader, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AddCategoryForm, CategoryRow } from "./category-ui";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <>
      <PageHeader title="Categories" description="Group products for browsing and filtering in the store." />
      <Card className="mb-6">
        <div className="p-5">
          <AddCategoryForm />
        </div>
      </Card>
      <div className="overflow-x-auto border bg-white">
        <table className="w-full min-w-[480px]">
          <thead className="border-b bg-surface/50">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Slug</th>
              <th className={`${th} text-right`}>Products</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c) => (
              <CategoryRow key={c.id} id={c.id} name={c.name} slug={c.slug} products={c._count.products} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
