import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, className, children }: { title?: string; actions?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("border bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="font-sans text-[13px] font-semibold normal-case tracking-normal">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const ORDER_TONES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-800 border-sky-200",
  PROCESSING: "bg-indigo-50 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-violet-50 text-violet-800 border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const PAYMENT_TONES: Record<PaymentStatus, string> = {
  UNPAID: "bg-neutral-50 text-neutral-600 border-neutral-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const Pill = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <span className={cn("inline-flex items-center border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", className)}>{children}</span>
);

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <Pill className={ORDER_TONES[status]}>{status.toLowerCase()}</Pill>;
export const PaymentBadge = ({ status }: { status: PaymentStatus }) => <Pill className={PAYMENT_TONES[status]}>{status.toLowerCase()}</Pill>;

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-[14px] text-muted">
        {children}
      </td>
    </tr>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";
export const td = "px-4 py-3 text-[14px] align-middle";
