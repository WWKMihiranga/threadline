import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="container-page max-w-2xl pt-12 md:pt-16">
      <h1 className="text-3xl md:text-4xl">Track your order</h1>
      <p className="mb-10 mt-3 text-[15px] text-muted">Enter the order number from your confirmation and the mobile number you used at checkout.</p>
      <TrackForm />
    </div>
  );
}
