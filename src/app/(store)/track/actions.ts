"use server";

import { z } from "zod";
import { db } from "@/lib/db";

type Values = { number: string; phone: string };
export type TrackResult =
  | { status: "idle"; values?: Values }
  | { status: "error"; message: string; values: Values }
  | {
      status: "found";
      values: Values;
      order: {
        number: number;
        status: string;
        paymentMethod: string;
        paymentStatus: string;
        total: number;
        createdAt: string;
        items: { productName: string; colour: string; size: string; quantity: number }[];
      };
    };

const schema = z.object({
  number: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/^TL-?/i, "")))
    .pipe(z.number().int().positive("Enter your order number, e.g. TL-1001")),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(?:\+94|94|0)7\d{8}$/, "Enter the mobile number used for the order")),
});

/**
 * Public order lookup. Requires BOTH the order number and the phone number on the order,
 * and gives the same answer for "no such order" and "wrong phone", so it can't be used
 * to discover other customers' orders. Only status and items are returned, never the address.
 */
export async function trackOrder(_prev: TrackResult, formData: FormData): Promise<TrackResult> {
  const values = { number: String(formData.get("number") ?? "").slice(0, 20), phone: String(formData.get("phone") ?? "").slice(0, 20) };
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message, values };

  const phone = "0" + parsed.data.phone.slice(-9);
  const order = await db.order.findUnique({
    where: { number: parsed.data.number },
    include: { items: { select: { productName: true, colour: true, size: true, quantity: true } } },
  });

  if (!order || order.phone !== phone) {
    return { status: "error", values, message: "We couldn't find an order with those details. Check the order number and phone number." };
  }

  return {
    status: "found",
    values,
    order: {
      number: order.number,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      items: order.items,
    },
  };
}
