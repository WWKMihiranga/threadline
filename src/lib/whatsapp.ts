import { formatOrderNumber, formatPrice } from "@/lib/format";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

type MessageOrder = {
  number: number;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  notes: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  items: { productName: string; colour: string; size: string; quantity: number; unitPrice: number }[];
};

/**
 * Groups the cart by product + colour so a bulk order stays readable:
 *   • Black Oversized T-Shirt — M × 10, L × 5
 */
export function buildWhatsAppMessage(order: MessageOrder) {
  const groups = new Map<string, { label: string; sizes: { size: string; qty: number }[]; amount: number }>();

  for (const item of order.items) {
    const key = `${item.productName}|${item.colour}`;
    const group = groups.get(key) ?? { label: `${item.colour} ${item.productName}`, sizes: [], amount: 0 };
    group.sizes.push({ size: item.size, qty: item.quantity });
    group.amount += item.unitPrice * item.quantity;
    groups.set(key, group);
  }

  const lines = [...groups.values()].map((g) => {
    const sizes = g.sizes
      .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
      .map((s) => `${s.size} × ${s.qty}`)
      .join(", ");
    return `• ${g.label} — ${sizes} (${formatPrice(g.amount)})`;
  });

  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return [
    `Hello Threadline! I'd like to place an order.`,
    ``,
    `*Order ${formatOrderNumber(order.number)}*`,
    ...lines,
    ``,
    `Items: ${totalQty}`,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    ...(order.discount > 0 ? [`Bulk discount: -${formatPrice(order.discount)}`] : []),
    `Delivery: ${order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}`,
    `*Total: ${formatPrice(order.total)}*`,
    ``,
    `*Customer*`,
    `${order.customerName}`,
    `${order.phone}`,
    `${order.addressLine}, ${order.city}`,
    ...(order.notes ? [``, `Note: ${order.notes}`] : []),
  ].join("\n");
}

export function whatsAppUrl(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
