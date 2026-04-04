"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { ErrorState } from "@/components/shared/error-state";
import { cancelOrderByCustomer, getOrderById } from "@/features/orders/api";
import { isCustomerTrackingAvailable } from "@/features/orders/tracking";
import { mapApiError } from "@/lib/api/error";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const timeline = ["CREATED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export default function OrderDetailsPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ orderId: string }>();
  const customerId = useAuthStore((state) => state.session?.user.id);
  const query = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => getOrderById(params.orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrderByCustomer(customerId as string, params.orderId),
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["orders", customerId] });
      query.refetch();
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  if (query.isLoading) {
    return <Skeleton className="h-72" />;
  }

  if (query.isError) {
    return <ErrorState description={mapApiError(query.error).message} />;
  }

  const order = query.data;

  if (!order) {
    return <ErrorState description="Order data is unavailable." />;
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold">Order details</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Order ID: {order.orderId}</p>
        <StatusBadge value={order.status} type="order" />
        <p className="text-sm text-[var(--color-text-muted)]">Created: {formatDateTime(order.createdAt)}</p>
        <p className="font-semibold">Total: {formatCurrency(order.totalAmount)}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={
              cancelMutation.isPending ||
              !customerId ||
              order.status === "DELIVERED" ||
              order.status === "CANCELLED"
            }
            onClick={() => cancelMutation.mutate()}
          >
            Cancel order
          </Button>
          {isCustomerTrackingAvailable(order) ? (
            <Link href={`/customer/orders/${order.orderId}/tracking`}>
              <Button>Open tracking</Button>
            </Link>
          ) : (
            <p className="self-center text-sm text-[var(--color-text-muted)]">
              Tracking will be available once a delivery partner accepts your order.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Status timeline</h2>
        <ol className="mt-4 space-y-2">
          {timeline.map((status) => {
            const isActive = timeline.indexOf(status) <= timeline.indexOf(order.status as (typeof timeline)[number]);
            return (
              <li key={status} className={isActive ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}>
                {status.replaceAll("_", " ")}
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
