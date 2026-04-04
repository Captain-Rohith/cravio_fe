"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cancelOrderByCustomer, getOrdersByCustomer } from "@/features/orders/api";
import { isCustomerTrackingAvailable } from "@/features/orders/tracking";
import { mapApiError } from "@/lib/api/error";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

function isValidOrderId(value: unknown): value is string | number {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }

  if (typeof value === "string") {
    if (value === "undefined" || value === "null") {
      return false;
    }
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric > 0;
  }

  return false;
}

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const customerId = useAuthStore((state) => state.session?.user.id);

  const query = useQuery({
    enabled: Boolean(customerId),
    queryKey: ["orders", customerId],
    queryFn: () => getOrdersByCustomer(customerId as string),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrderByCustomer(customerId as string, orderId),
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["orders", customerId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  if (query.isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (query.isError) {
    return <ErrorState description={mapApiError(query.error).message} />;
  }

  if (!query.data?.length) {
    return <EmptyState title="No orders found" description="Your completed and active orders appear here." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Order history</h1>
      {query.data.map((order) => (
        <Card key={order.orderId} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{order.orderId}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge value={order.status} type="order" />
          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
          <div className="flex gap-2">
            {isValidOrderId(order.orderId) ? <Link href={`/customer/orders/${order.orderId}`}>Details</Link> : null}
            {isValidOrderId(order.orderId) && isCustomerTrackingAvailable(order) ? (
              <Link href={`/customer/orders/${order.orderId}/tracking`}>Tracking</Link>
            ) : isValidOrderId(order.orderId) ? (
              <span className="text-sm text-[var(--color-text-muted)]">Tracking pending</span>
            ) : null}
            <Button
              variant="outline"
              disabled={
                cancelMutation.isPending ||
                order.status === "DELIVERED" ||
                order.status === "CANCELLED" ||
                !isValidOrderId(order.orderId)
              }
              onClick={() => {
                if (!isValidOrderId(order.orderId)) {
                  return;
                }
                cancelMutation.mutate(String(order.orderId));
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
