import { cn } from "@/lib/utils";

const fieldBase =
  "w-full border border-border bg-white px-3 text-[15px] text-foreground placeholder:text-muted/70 outline-none transition-colors focus:border-foreground aria-[invalid=true]:border-sale disabled:bg-surface";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-11 appearance-none bg-[length:12px] pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-foreground", className)} {...props} />;
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-[13px] text-sale">
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}
