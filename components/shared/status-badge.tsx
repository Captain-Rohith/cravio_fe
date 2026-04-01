import type { OrderStatus, PaymentDetails } from "@/types/dto";
import { cn } from "@/lib/utils";

type PaymentStatus = PaymentDetails["status"];

const orderPalette: Record<OrderStatus, string> = {
  CREATED: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PREPARING: "bg-amber-100 text-amber-700",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const paymentPalette: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

interface StatusBadgeProps {
  value: OrderStatus | PaymentStatus;
  type: "order" | "payment";
}

export function StatusBadge({ value, type }: StatusBadgeProps) {
  const paletteClass =
    type === "order"
      ? orderPalette[value as OrderStatus]
      : paymentPalette[value as PaymentStatus];

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", paletteClass)}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
