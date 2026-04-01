import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)] focus-visible:ring-[var(--color-brand)]",
  secondary:
    "bg-[var(--color-surface-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface)] focus-visible:ring-[var(--color-brand)]",
  outline:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)] focus-visible:ring-[var(--color-brand)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:brightness-95 focus-visible:ring-[var(--color-danger)]",
};

export function Button({
  className,
  variant = "primary",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
}
