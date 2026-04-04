"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  getAcceptedOrdersByDeliveryPartner,
  claimNearbyOrder,
  getNearbyAvailableOrders,
  getOrderById,
  updateOrderStatus,
} from "@/features/orders/api";
import { getLatestCustomerTrackingEvent, sendLocationUpdate } from "@/features/tracking/api";
import { useCustomerOrderTracking } from "@/features/tracking/hooks/useCustomerOrderTracking";
import type { MapMarker } from "@/features/maps/types";
import { mapApiError } from "@/lib/api/error";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { OrderStatus } from "@/types/dto";

const statusOptions: OrderStatus[] = ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

const MapView = dynamic(
  () => import("@/features/maps/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
    ),
  },
);

function ConnectionBadge({ state }: { state: "connected" | "reconnecting" | "offline" }) {
  const palette =
    state === "connected"
      ? "bg-emerald-100 text-emerald-700"
      : state === "reconnecting"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette}`}>{state}</span>;
}

export default function DeliveryOrdersPage() {
  const queryClient = useQueryClient();
  const partnerId = useAuthStore((state) => state.session?.user.id) ?? "";
  const [activeOrderId, setActiveOrderId] = useState("");
  const [polling, setPolling] = useState(false);
  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946, h3Index: "" });

  const nearbyOrdersQuery = useQuery({
    queryKey: ["delivery-nearby-orders", coords.latitude, coords.longitude],
    queryFn: () => getNearbyAvailableOrders(coords.latitude, coords.longitude),
    refetchInterval: 10000,
  });

  const selectedOrderQuery = useQuery({
    enabled: activeOrderId.trim().length > 0,
    queryKey: ["delivery-order", activeOrderId],
    queryFn: () => getOrderById(activeOrderId),
  });
  const latestCustomerLocationQuery = useQuery({
    enabled: activeOrderId.trim().length > 0,
    queryKey: ["delivery-customer-latest", activeOrderId],
    queryFn: () => getLatestCustomerTrackingEvent(activeOrderId),
    refetchInterval: 10000,
  });
  const {
    latestEvent: customerLiveEvent,
    connectionState: customerTrackingConnectionState,
    customerMarker: customerLiveMarker,
    lastUpdatedLabel: customerTrackingUpdatedLabel,
  } = useCustomerOrderTracking(activeOrderId.trim() ? activeOrderId : null);

  const acceptedOrdersQuery = useQuery({
    queryKey: ["delivery-accepted-orders"],
    queryFn: () => getAcceptedOrdersByDeliveryPartner(),
    refetchInterval: 15000,
  });

  const claimMutation = useMutation({
    mutationFn: (orderId: string) => claimNearbyOrder(orderId, coords.latitude, coords.longitude),
    onSuccess: (claimedOrder) => {
      const claimedOrderId = claimedOrder.orderId || claimedOrder.id;
      setActiveOrderId(claimedOrderId);
      toast.success(`Order ${claimedOrderId} claimed successfully`);
      queryClient.invalidateQueries({ queryKey: ["delivery-nearby-orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-order", claimedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["delivery-accepted-orders"] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const updateMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(activeOrderId, status),
    onSuccess: () => {
      toast.success("Order status updated");
      selectedOrderQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["delivery-nearby-orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-accepted-orders"] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const locationMutation = useMutation({
    mutationFn: () =>
      sendLocationUpdate({
        orderId: activeOrderId,
        deliveryPartnerId: partnerId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        h3Index: coords.h3Index || undefined,
      }),
    onSuccess: () => toast.success("Location update sent"),
    onError: (error) => toast.error(mapApiError(error).message),
  });

  useEffect(() => {
    if (!polling || !activeOrderId) {
      return;
    }

    const interval = setInterval(() => {
      locationMutation.mutate();
    }, 12000);

    return () => clearInterval(interval);
  }, [locationMutation, activeOrderId, polling]);

  const nearbyErrorMessage = nearbyOrdersQuery.isError
    ? mapApiError(nearbyOrdersQuery.error).message
    : "Unable to load nearby orders";

  const acceptedOrders = useMemo(() => acceptedOrdersQuery.data ?? [], [acceptedOrdersQuery.data]);
  const acceptedMarkers = useMemo<MapMarker[]>(() => {
    const markers: MapMarker[] = [];

    acceptedOrders.forEach((order) => {
      if (typeof order.restaurantLatitude === "number" && typeof order.restaurantLongitude === "number") {
        markers.push({
          id: `pickup-${order.orderId}`,
          type: "restaurant",
          lat: order.restaurantLatitude,
          lng: order.restaurantLongitude,
          label: `Pickup - Order ${order.orderId}`,
          status: "Restaurant",
        });
      }

      if (typeof order.deliveryLatitude === "number" && typeof order.deliveryLongitude === "number") {
        markers.push({
          id: `customer-${order.orderId}`,
          type: "customer",
          lat: order.deliveryLatitude,
          lng: order.deliveryLongitude,
          label: `Customer - Order ${order.orderId}`,
          status: order.deliveryAddress || "Drop location",
        });
      }
    });

    return markers;
  }, [acceptedOrders]);

  const effectiveCustomerTrackingEvent = useMemo(
    () => customerLiveEvent ?? latestCustomerLocationQuery.data ?? null,
    [customerLiveEvent, latestCustomerLocationQuery.data],
  );
  const effectiveLiveCustomerMarker = useMemo(
    () =>
      customerLiveMarker ??
      (effectiveCustomerTrackingEvent
        ? {
            id: String(effectiveCustomerTrackingEvent.customerId ?? `customer-${activeOrderId}`),
            type: "customer" as const,
            lat: effectiveCustomerTrackingEvent.latitude,
            lng: effectiveCustomerTrackingEvent.longitude,
            label: "Customer (live)",
            status: "Live shared location",
            updatedAt: effectiveCustomerTrackingEvent.timestamp,
          }
        : null),
    [activeOrderId, customerLiveMarker, effectiveCustomerTrackingEvent],
  );

  const activeOrderTrackingMarkers = useMemo<MapMarker[]>(() => {
    const activeOrder = selectedOrderQuery.data;
    if (!activeOrder) {
      return [];
    }

    const markers: MapMarker[] = [];

    if (typeof activeOrder.restaurantLatitude === "number" && typeof activeOrder.restaurantLongitude === "number") {
      markers.push({
        id: `active-pickup-${activeOrder.orderId}`,
        type: "restaurant",
        lat: activeOrder.restaurantLatitude,
        lng: activeOrder.restaurantLongitude,
        label: "Pickup",
        status: "Restaurant",
      });
    }

    if (effectiveLiveCustomerMarker) {
      markers.push(effectiveLiveCustomerMarker);
    } else if (
      typeof activeOrder.deliveryLatitude === "number" &&
      typeof activeOrder.deliveryLongitude === "number"
    ) {
      markers.push({
        id: `active-destination-${activeOrder.orderId}`,
        type: "customer",
        lat: activeOrder.deliveryLatitude,
        lng: activeOrder.deliveryLongitude,
        label: "Customer destination",
        status: activeOrder.deliveryAddress || "Drop location",
      });
    }

    markers.push({
      id: "active-delivery-self",
      type: "delivery-partner",
      lat: coords.latitude,
      lng: coords.longitude,
      label: "You (delivery)",
      status: "Current location",
    });

    return markers;
  }, [coords.latitude, coords.longitude, effectiveLiveCustomerMarker, selectedOrderQuery.data]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Available orders in vicinity</h1>
        <Link href="/delivery/tracking" className="text-sm font-semibold text-[var(--color-brand)]">
          Open location tracking
        </Link>
      </header>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Delivery vicinity</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          All nearby delivery partners at these coordinates will see the same unclaimed order pool.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
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
          <Button
            variant="secondary"
            isLoading={nearbyOrdersQuery.isFetching}
            onClick={() => nearbyOrdersQuery.refetch()}
          >
            Refresh nearby orders
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Nearby unclaimed orders</h2>
        {nearbyOrdersQuery.isLoading ? <p className="text-sm text-[var(--color-text-muted)]">Loading nearby orders...</p> : null}
        {nearbyOrdersQuery.isError ? (
          <ErrorState description={nearbyErrorMessage} onRetry={() => nearbyOrdersQuery.refetch()} />
        ) : null}
        {nearbyOrdersQuery.isSuccess && nearbyOrdersQuery.data.length === 0 ? (
          <EmptyState
            title="No nearby orders"
            description="No unclaimed orders are currently available in your vicinity."
          />
        ) : null}
        {nearbyOrdersQuery.isSuccess && nearbyOrdersQuery.data.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {nearbyOrdersQuery.data.map((order) => (
              <Card key={order.orderId} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{order.restaurantName}</h3>
                  <StatusBadge value={order.status} type="order" />
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">Order ID: {order.orderId}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Pickup: {order.pickupLatitude.toFixed(6)}, {order.pickupLongitude.toFixed(6)}
                </p>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {formatCurrency(order.totalAmount)}
                </p>
                <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
                  {order.items.map((item, index) => (
                    <li key={`${order.orderId}-${item.menuItemId}-${index}`}>
                      Item {item.menuItemId} x {item.quantity}
                    </li>
                  ))}
                </ul>
                <Button
                  isLoading={claimMutation.isPending}
                  onClick={() => claimMutation.mutate(order.orderId)}
                >
                  Claim order
                </Button>
              </Card>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">My accepted orders</h2>
        {acceptedOrdersQuery.isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading accepted orders...</p>
        ) : null}
        {acceptedOrdersQuery.isError ? (
          <ErrorState
            description={mapApiError(acceptedOrdersQuery.error).message}
            onRetry={() => acceptedOrdersQuery.refetch()}
          />
        ) : null}
        {acceptedOrdersQuery.isSuccess && acceptedOrders.length === 0 ? (
          <EmptyState
            title="No accepted orders yet"
            description="Claim an order from nearby pool to start delivery."
          />
        ) : null}
        {acceptedOrdersQuery.isSuccess && acceptedOrders.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {acceptedOrders.map((order) => (
              <Card key={`accepted-${order.orderId}`} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Order #{order.orderId}</p>
                  <StatusBadge value={order.status} type="order" />
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Customer ID: {order.customerId}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Destination:{" "}
                  {typeof order.deliveryLatitude === "number" && typeof order.deliveryLongitude === "number"
                    ? `${order.deliveryLatitude.toFixed(6)}, ${order.deliveryLongitude.toFixed(6)}`
                    : "Not shared yet"}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Address: {order.deliveryAddress || "Not available"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveOrderId(order.orderId)}
                >
                  Set as active
                </Button>
              </Card>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Accepted order locations</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Restaurant and customer destination markers for your claimed orders.
        </p>
        {acceptedMarkers.length > 0 ? (
          <MapView markers={acceptedMarkers} zoom={13} />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            Customer destination location will appear after order creation includes coordinates.
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Claimed order operations</h2>
        <div className="max-w-sm">
          <label className="mb-1 block text-sm font-medium">Active order ID</label>
          <Input value={activeOrderId} onChange={(event) => setActiveOrderId(event.target.value)} />
        </div>
        {selectedOrderQuery.isLoading ? <p className="text-sm text-[var(--color-text-muted)]">Loading order...</p> : null}
        {selectedOrderQuery.data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge value={selectedOrderQuery.data.status} type="order" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Delivery partner: {selectedOrderQuery.data.deliveryPartnerId || "Unassigned"}
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
        <h2 className="text-xl font-semibold">Customer live tracking (active order)</h2>
        {!activeOrderId.trim() ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Set an active order ID to view customer live location.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-muted)]">Connection:</span>
              <ConnectionBadge state={customerTrackingConnectionState} />
              <span className="text-[var(--color-text-muted)]">
                Last updated{" "}
                {customerLiveEvent
                  ? customerTrackingUpdatedLabel
                  : effectiveCustomerTrackingEvent
                    ? "from latest snapshot"
                    : customerTrackingUpdatedLabel}
              </span>
            </div>
            {effectiveCustomerTrackingEvent ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Customer live location: {effectiveCustomerTrackingEvent.latitude},{" "}
                {effectiveCustomerTrackingEvent.longitude}
              </p>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                Waiting for customer live location updates. Destination marker is used as fallback.
              </p>
            )}
            {activeOrderTrackingMarkers.length > 0 ? <MapView markers={activeOrderTrackingMarkers} zoom={14} /> : null}
          </>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Location update</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Send live location updates for your active claimed order.
        </p>
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
          <Button
            onClick={() => {
              if (!activeOrderId.trim()) {
                toast.error("Set an active order ID before sending tracking updates");
                return;
              }
              locationMutation.mutate();
            }}
            isLoading={locationMutation.isPending}
          >
            Send update
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!activeOrderId.trim()) {
                toast.error("Set an active order ID before starting periodic updates");
                return;
              }
              setPolling((prev) => !prev);
            }}
          >
            {polling ? "Stop periodic updates" : "Start periodic updates"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
