import "server-only";
import { z } from "zod";

// Server-side environment variables, validated once on first use.
// Secrets (PayHere merchant secret, auth secret) never get a NEXT_PUBLIC_ prefix,
// so they can never be bundled into browser JavaScript.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  APP_URL: z.string().url(),
  PAYHERE_MERCHANT_ID: z.string().min(1),
  PAYHERE_MERCHANT_SECRET: z.string().min(1),
  PAYHERE_SANDBOX: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  WHATSAPP_NUMBER: z
    .string()
    .regex(/^94\d{9}$/, "WHATSAPP_NUMBER must be in international format without +, e.g. 94771234567"),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Invalid environment variables:\n${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}
