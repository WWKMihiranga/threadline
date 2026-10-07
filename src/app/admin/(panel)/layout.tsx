import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Threadline Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const pendingOrders = await db.order.count({ where: { status: "PENDING" } });

  return (
    <div className="min-h-dvh bg-[#f7f6f4]">
      <AdminNav email={admin.email} pendingOrders={pendingOrders} />
      <main className="px-4 py-8 lg:ml-60 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
