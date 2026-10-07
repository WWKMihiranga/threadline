// Pricing rules shared by the cart (for display) and the server (authoritative).
// The server always recalculates from database prices; client numbers are never trusted.

export const SHIPPING_FEE = 450;
export const FREE_SHIPPING_THRESHOLD = 15000;
export const MAX_QTY_PER_LINE = 200;

// Bulk discount is based on the total quantity of ONE product across all its sizes/colours.
// e.g. Black Tee M×6 + L×4 = 10 units of that product → 10% off those lines.
export const BULK_TIERS = [
  { minQty: 25, percent: 15 },
  { minQty: 10, percent: 10 },
] as const;

export function bulkPercentFor(productQty: number): number {
  return BULK_TIERS.find((t) => productQty >= t.minQty)?.percent ?? 0;
}

export type PricedLine = { productId: string; unitPrice: number; quantity: number };

export function calculateTotals(lines: PricedLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const qtyByProduct = new Map<string, number>();
  const amountByProduct = new Map<string, number>();
  for (const l of lines) {
    qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.quantity);
    amountByProduct.set(l.productId, (amountByProduct.get(l.productId) ?? 0) + l.unitPrice * l.quantity);
  }

  let discount = 0;
  for (const [productId, qty] of qtyByProduct) {
    const percent = bulkPercentFor(qty);
    if (percent) discount += Math.round(((amountByProduct.get(productId) ?? 0) * percent) / 100);
  }

  const afterDiscount = subtotal - discount;
  const shippingFee = lines.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return { subtotal, discount, shippingFee, total: afterDiscount + shippingFee };
}
