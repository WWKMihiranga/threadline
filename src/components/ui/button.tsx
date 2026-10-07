import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.1em] transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-white hover:bg-black/80",
        light: "bg-white text-foreground hover:bg-white/85",
        outline: "border border-foreground/25 bg-transparent text-foreground hover:border-foreground",
        ghost: "bg-transparent text-foreground hover:bg-surface",
        whatsapp: "bg-whatsapp text-white hover:bg-whatsapp/90",
        danger: "bg-sale text-white hover:bg-sale/90",
        link: "h-auto px-0 normal-case tracking-normal underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
