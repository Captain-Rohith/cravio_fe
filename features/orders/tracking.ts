import type { OrderDetails, OrderStatus } from "@/types/dto";

const statusWithoutTracking = new Set<OrderStatus>(["CANCELLED"]);

export function isCustomerTrackingAvailable(order: Pick<OrderDetails, "deliveryPartnerId" | "status"> | null | undefined): boolean {
  if (!order) {
    return false;
  }

  return Boolean(order.deliveryPartnerId) && !statusWithoutTracking.has(order.status);
}
