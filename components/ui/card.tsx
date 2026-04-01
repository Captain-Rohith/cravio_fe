import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}
