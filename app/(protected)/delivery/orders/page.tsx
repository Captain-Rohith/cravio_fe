"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { getOrderById, updateOrderStatus } from "@/features/orders/api";
import { sendLocationUpdate } from "@/features/tracking/api";
import { mapApiError } from "@/lib/api/error";
import { useAuthStore } from "@/store/auth-store";
import type { OrderStatus } from "@/types/dto";

const statusOptions: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function DeliveryOrdersPage() {
  const partnerId = useAuthStore((state) => state.session?.user.id) ?? "";
  const [orderId, setOrderId] = useState("");
  const [polling, setPolling] = useState(false);
  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946, h3Index: "" });

  const orderQuery = useQuery({
    enabled: orderId.length > 2,
    queryKey: ["delivery-order", orderId],
    queryFn: () => getOrderById(orderId),
  });

  const updateMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      toast.success("Order status updated");
      orderQuery.refetch();
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const locationMutation = useMutation({
    mutationFn: () =>
      sendLocationUpdate({
        orderId,
        deliveryPartnerId: partnerId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        h3Index: coords.h3Index || undefined,
      }),
    onSuccess: () => toast.success("Location update sent"),
    onError: (error) => toast.error(mapApiError(error).message),
  });

  useEffect(() => {
    if (!polling || !orderId) {
      return;
    }

    const interval = setInterval(() => {
      locationMutation.mutate();
    }, 12000);

    return () => clearInterval(interval);
  }, [locationMutation, orderId, polling]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Assigned orders dashboard</h1>
        <Link href="/delivery/tracking" className="text-sm font-semibold text-[var(--color-brand)]">
          Open location tracking
        </Link>
      </header>
      <Card className="space-y-4">
        <div className="max-w-sm">
          <label className="mb-1 block text-sm font-medium">Order ID</label>
          <Input value={orderId} onChange={(event) => setOrderId(event.target.value)} />
        </div>
        {orderQuery.data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge value={orderQuery.data.status} type="order" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Delivery partner: {orderQuery.data.deliveryPartnerId || "Unassigned"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  onClick={() => updateMutation.mutate(status)}
                  isLoading={updateMutation.isPending}
                >
                  {status.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Location update</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            type="number"
            step="0.000001"
            value={coords.latitude}
            onChange={(event) => setCoords((prev) => ({ ...prev, latitude: Number(event.target.value) }))}
            placeholder="Latitude"
          />
          <Input
            type="number"
            step="0.000001"
            value={coords.longitude}
            onChange={(event) => setCoords((prev) => ({ ...prev, longitude: Number(event.target.value) }))}
            placeholder="Longitude"
          />
          <Input
            value={coords.h3Index}
            onChange={(event) => setCoords((prev) => ({ ...prev, h3Index: event.target.value }))}
            placeholder="H3 index"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => locationMutation.mutate()} isLoading={locationMutation.isPending}>
            Send update
          </Button>
          <Button variant="outline" onClick={() => setPolling((prev) => !prev)}>
            {polling ? "Stop periodic updates" : "Start periodic updates"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
