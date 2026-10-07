import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-page pt-10 md:pt-14">
      <h1 className="mb-10 text-3xl md:text-4xl">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
