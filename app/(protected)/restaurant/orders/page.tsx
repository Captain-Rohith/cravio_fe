"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrdersByRestaurant, updateRestaurantOrderStatus } from "@/features/orders/api";
import { useRestaurantId } from "@/hooks/use-restaurant-id";
import { mapApiError } from "@/lib/api/error";
import { formatDateTime } from "@/lib/utils";
import type { OrderDetails, OrderStatus } from "@/types/dto";

const statusOptions: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function RestaurantOrdersPage() {
  const { restaurantId, setRestaurantId } = useRestaurantId();
  const hasRestaurantProfileId = restaurantId.trim().length > 0;
  const [targetOrder, setTargetOrder] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ordersQuery = useQuery({
    enabled: hasRestaurantProfileId,
    queryKey: ["restaurant-orders", restaurantId],
    queryFn: () => getOrdersByRestaurant(restaurantId),
  });

  const ordersError = ordersQuery.isError ? mapApiError(ordersQuery.error) : null;
  const profileMissing = ordersError?.statusCode === 404;

  const statusByOrderId = useMemo(() => {
    const result: Record<string, OrderStatus> = {};
    (ordersQuery.data ?? []).forEach((order) => {
      result[String(order.orderId)] = order.status;
    });
    return result;
  }, [ordersQuery.data]);

  const [draftStatuses, setDraftStatuses] = useState<Record<string, OrderStatus>>({});

  const updateStatusMutation = useMutation({
    mutationFn: () => {
      if (!targetOrder) {
        throw new Error("No order selected");
      }
      return updateRestaurantOrderStatus(restaurantId, targetOrder.orderId, targetOrder.status);
    },
    onSuccess: () => {
      toast.success("Order status updated");
      setConfirmOpen(false);
      setTargetOrder(null);
      ordersQuery.refetch();
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Order management</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          View all orders for your restaurant and move them through preparation and fulfillment.
        </p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Restaurant scope</h2>
        <Input
          value={restaurantId}
          onChange={(event) => setRestaurantId(event.target.value)}
          placeholder="Restaurant ID"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Use your restaurant profile ID from create response `response.data.id`.
        </p>
      </Card>

      {!hasRestaurantProfileId ? (
        <Card className="space-y-3 border-[var(--color-brand)]/40">
          <h2 className="text-lg font-semibold">Restaurant profile ID required</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Auth user ID is different from restaurant profile ID. Create or link your restaurant profile first.
          </p>
          <Link href="/restaurant/location">
            <Button>Open location and create/link profile</Button>
          </Link>
        </Card>
      ) : null}

      {ordersQuery.isLoading ? <Skeleton className="h-56" /> : null}
      {hasRestaurantProfileId && profileMissing ? (
        <Card className="space-y-3 border-[var(--color-brand)]/40">
          <h2 className="text-lg font-semibold">Restaurant profile not found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Orders are available only after creating or linking your restaurant profile.
          </p>
          <Link href="/restaurant/location">
            <Button>Open location and create profile</Button>
          </Link>
        </Card>
      ) : null}

      {ordersQuery.isError && !profileMissing ? (
        <ErrorState description={ordersError?.message ?? "Unable to load orders"} onRetry={() => ordersQuery.refetch()} />
      ) : null}

      {ordersQuery.isSuccess && ordersQuery.data.length === 0 ? (
        <EmptyState
          title="No orders for this restaurant"
          description="Customer orders will appear here once placed."
        />
      ) : null}

      {ordersQuery.isSuccess && ordersQuery.data.length > 0 ? (
        <DataTable
          rows={ordersQuery.data}
          rowKey={(row) => String(row.orderId)}
          columns={[
            { key: "orderId", header: "Order ID" },
            { key: "customerId", header: "Customer" },
            {
              key: "createdAt",
              header: "Created",
              render: (value) => formatDateTime(String(value ?? "")),
            },
            {
              key: "status",
              header: "Status",
              render: (value) => <StatusBadge value={String(value) as OrderStatus} type="order" />,
            },
            { key: "totalAmount", header: "Total" },
            {
              key: "orderId",
              header: "Actions",
              render: (value, row) => {
                const order = row as OrderDetails;
                const orderId = String(value);
                const selectedStatus = draftStatuses[orderId] ?? statusByOrderId[orderId] ?? order.status;

                return (
                  <div className="flex min-w-[260px] items-center gap-2">
                    <select
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs"
                      value={selectedStatus}
                      onChange={(event) =>
                        setDraftStatuses((prev) => ({
                          ...prev,
                          [orderId]: event.target.value as OrderStatus,
                        }))
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTargetOrder({ orderId, status: selectedStatus });
                        setConfirmOpen(true);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      ) : null}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm status update"
        description="This updates customer and delivery workflows for this order. Continue?"
        confirmLabel="Apply"
        onCancel={() => {
          setConfirmOpen(false);
          setTargetOrder(null);
        }}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </div>
  );
}
