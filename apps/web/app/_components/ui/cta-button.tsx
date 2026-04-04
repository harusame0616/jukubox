import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export function CtaPrimaryButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative bg-transparent border border-primary text-primary",
        "transition-all duration-350 ease-in overflow-hidden cursor-pointer",
        "before:content-[''] before:absolute before:inset-0 before:bg-primary",
        "before:scale-x-0 before:origin-left before:transition-transform",
        "before:duration-350 before:ease-in before:z-0",
        "hover:before:scale-x-100 hover:text-background",
        "hover:shadow-[0_0_16px_oklch(0.75_0.12_77/0.3)]",
        className,
      )}
      {...props}
    >
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

export function CtaSecondaryButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative bg-transparent border border-[oklch(1_0_0/0.2)] text-muted-foreground",
        "transition-all duration-300 ease-in cursor-pointer",
        "hover:border-[oklch(1_0_0/0.45)] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
