const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });

export function formatPrice(amount: number) {
  return `Rs ${lkr.format(amount)}`;
}

export function formatOrderNumber(n: number) {
  return `TL-${n}`;
}

export function parseOrderNumber(value: string): number | null {
  const match = /^TL-(\d{1,9})$/i.exec(value.trim());
  return match ? Number(match[1]) : null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(date);
}
