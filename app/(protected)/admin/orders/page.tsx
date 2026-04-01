"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assignDeliveryPartner, getOrderById, updateOrderStatus } from "@/features/orders/api";
import { getPaymentByOrderId } from "@/features/payments/api";
import { mapApiError } from "@/lib/api/error";
import type { OrderStatus } from "@/types/dto";

const statuses: OrderStatus[] = [
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrderOperationsPage() {
  const [orderId, setOrderId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("CONFIRMED");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const orderQuery = useQuery({
    enabled: orderId.length > 2,
    queryKey: ["admin-order", orderId],
    queryFn: () => getOrderById(orderId),
  });

  const paymentQuery = useQuery({
    enabled: orderId.length > 2,
    queryKey: ["admin-payment", orderId],
    queryFn: () => getPaymentByOrderId(orderId),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignDeliveryPartner(orderId, partnerId),
    onSuccess: () => {
      toast.success("Delivery partner assigned");
      orderQuery.refetch();
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const statusMutation = useMutation({
    mutationFn: () => updateOrderStatus(orderId, selectedStatus),
    onSuccess: () => {
      toast.success("Status updated");
      setConfirmOpen(false);
      orderQuery.refetch();
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Order operations</h1>
      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
          <Input
            placeholder="Delivery partner ID"
            value={partnerId}
            onChange={(event) => setPartnerId(event.target.value)}
          />
          <Button onClick={() => assignMutation.mutate()} isLoading={assignMutation.isPending}>
            Assign partner
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Update status
          </Button>
        </div>
      </Card>

      {orderQuery.isError ? <ErrorState description={mapApiError(orderQuery.error).message} /> : null}

      {orderQuery.data ? (
        <DataTable
          rows={[orderQuery.data]}
          rowKey={(row) => String(row.orderId)}
          columns={[
            { key: "orderId", header: "Order ID" },
            { key: "customerId", header: "Customer" },
            { key: "deliveryPartnerId", header: "Partner" },
            {
              key: "status",
              header: "Status",
              render: (value) => <StatusBadge value={String(value) as OrderStatus} type="order" />,
            },
          ]}
        />
      ) : null}

      {paymentQuery.data ? (
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold">Payment details</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Transaction: {paymentQuery.data.transactionRef || "Unavailable"}</p>
          <StatusBadge value={paymentQuery.data.status} type="payment" />
        </Card>
      ) : null}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm order status change"
        description="This update affects downstream customer and delivery workflows. Continue?"
        confirmLabel="Apply update"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => statusMutation.mutate()}
      />
    </div>
  );
}
