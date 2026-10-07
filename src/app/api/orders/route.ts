import { NextResponse } from "next/server";
import { z } from "zod";
import { checkoutSchema } from "@/lib/validations";
import { createOrder } from "@/lib/services/orders";
import { buildCheckoutFields } from "@/lib/payhere";
import { orderPagePath } from "@/lib/order-token";

/**
 * POST /api/orders: place an order (guest checkout).
 *
 * 201 → { orderId, number, redirect, payhere? }
 * 400 → malformed JSON
 * 409 → { problems } cart is out of date (stock changed or item removed)
 * 422 → { fieldErrors } validation failed
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }

  try {
    const result = await createOrder(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: "Some items in your cart have changed.", problems: result.problems }, { status: 409 });
    }

    const { order } = result;
    const redirect = orderPagePath(order.id);
    return NextResponse.json(
      {
        orderId: order.id,
        number: order.number,
        redirect,
        payhere: order.paymentMethod === "PAYHERE" ? buildCheckoutFields(order, redirect) : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[orders] failed to create order", error);
    return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
  }
}
