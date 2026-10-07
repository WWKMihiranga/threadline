import { z } from "zod";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";
import { isAllowedImageUrl } from "@/lib/images";

// One set of schemas, used by the forms (instant feedback) and re-run on the
// server (the only check that actually protects the data).

const slPhone = z
  .string({ error: "Mobile number is required" })
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:\+94|94|0)7\d{8}$/.test(v), "Enter a valid Sri Lankan mobile number, e.g. 0771234567")
  .transform((v) => "0" + v.slice(-9)); // store as 07XXXXXXXX

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const checkoutSchema = z.object({
  firstName: z.string({ error: "First name is required" }).trim().min(2, "First name is required").max(50),
  lastName: z.string({ error: "Last name is required" }).trim().min(1, "Last name is required").max(50),
  email: z.string({ error: "Email is required" }).trim().toLowerCase().email("Enter a valid email address").max(120),
  phone: slPhone,
  addressLine: z.string({ error: "Enter your delivery address" }).trim().min(5, "Enter your delivery address").max(200),
  city: z.string({ error: "Enter your city" }).trim().min(2, "Enter your city").max(60),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  paymentMethod: z.enum(["PAYHERE", "WHATSAPP"], { error: "Choose how you want to order" }),
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(100),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(200),
});

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"] as const;

export const variantSchema = z.object({
  id: z.string().optional(),
  size: z.enum(SIZES),
  colour: z.string().trim().min(1, "Colour is required").max(30),
  colourHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #111111"),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,40}$/, "SKU: 3–40 letters, numbers or dashes"),
  stock: z.coerce.number().int().min(0, "Stock can't be negative").max(100000),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(100),
    description: z.string().trim().min(10, "Add a short description").max(2000),
    categoryId: z.string().min(1, "Choose a category"),
    price: z.coerce.number().int("Whole rupees only").min(1, "Price must be above 0").max(1_000_000),
    compareAtPrice: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
    images: z
      .array(z.string().url().refine(isAllowedImageUrl, "Images must be uploaded, or come from Unsplash"))
      .min(1, "Add at least one image")
      .max(8, "Up to 8 images"),
    isActive: z.boolean(),
    isNew: z.boolean(),
    isFeatured: z.boolean(),
    variants: z.array(variantSchema).min(1, "Add at least one size/colour variant").max(60),
  })
  .refine((p) => !p.compareAtPrice || p.compareAtPrice > p.price, {
    path: ["compareAtPrice"],
    message: "Original price must be higher than the selling price",
  })
  .refine((p) => new Set(p.variants.map((v) => `${v.size}|${v.colour.toLowerCase()}`)).size === p.variants.length, {
    path: ["variants"],
    message: "Each size + colour combination can only appear once",
  })
  .refine((p) => new Set(p.variants.map((v) => v.sku.toUpperCase())).size === p.variants.length, {
    path: ["variants"],
    message: "SKUs must be unique",
  });
export type ProductInput = z.input<typeof productSchema>;

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
