"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { getAcceptedOrdersByDeliveryPartner, getOrderById } from "@/features/orders/api";
import { pushLocationUpdate } from "@/features/tracking/api/pushLocationUpdate";
import { getLatestCustomerTrackingEvent } from "@/features/tracking/api";
import { useCustomerOrderTracking } from "@/features/tracking/hooks/useCustomerOrderTracking";
import { mapApiError } from "@/lib/api/error";
import { useAuthStore } from "@/store/auth-store";
import type { MapMarker } from "@/features/maps/types";

const MapView = dynamic(
  () => import("@/features/maps/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
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

export default function DeliveryTrackingPage() {
  const deliveryPartnerId = useAuthStore((state) => state.session?.user.id) ?? "";
  const [orderId, setOrderId] = useState("");
  const [trackingActive, setTrackingActive] = useState(false);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [h3Index, setH3Index] = useState("");
  const acceptedOrdersQuery = useQuery({
    queryKey: ["delivery-tracking-accepted-orders"],
    queryFn: () => getAcceptedOrdersByDeliveryPartner(),
    refetchInterval: 15000,
  });
  const selectedOrderId = orderId || acceptedOrdersQuery.data?.[0]?.orderId || "";

  const selectedOrderQuery = useQuery({
    enabled: Boolean(selectedOrderId),
    queryKey: ["delivery-tracking-order", selectedOrderId],
    queryFn: () => getOrderById(selectedOrderId),
    refetchInterval: 10000,
  });

  const latestCustomerLocationQuery = useQuery({
    enabled: Boolean(selectedOrderId),
    queryKey: ["delivery-tracking-customer-latest", selectedOrderId],
    queryFn: () => getLatestCustomerTrackingEvent(selectedOrderId),
    refetchInterval: 10000,
  });

  const {
    latestEvent: customerLiveEvent,
    connectionState: customerTrackingConnectionState,
    customerMarker: customerLiveMarker,
    lastUpdatedLabel: customerTrackingUpdatedLabel,
  } = useCustomerOrderTracking(selectedOrderId ? selectedOrderId : null);

  const locationMutation = useMutation({
    mutationFn: () =>
      pushLocationUpdate({
        orderId: selectedOrderId,
        deliveryPartnerId,
        latitude: coords.lat,
        longitude: coords.lng,
        h3Index: h3Index || undefined,
      }),
    onSuccess: () => toast.success("Location update sent"),
    onError: (error) => toast.error(mapApiError(error).message),
  });

  useEffect(() => {
    if (!trackingActive) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        toast.error("Unable to access GPS location");
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingActive]);

  useEffect(() => {
    if (!trackingActive || !selectedOrderId) {
      return;
    }

    const interval = setInterval(() => {
      locationMutation.mutate();
    }, 10000);

    return () => clearInterval(interval);
  }, [locationMutation, selectedOrderId, trackingActive]);

  const markers = useMemo<MapMarker[]>(
    () => {
      const nextMarkers: MapMarker[] = [
        {
          id: `delivery-${deliveryPartnerId}`,
          type: "delivery-partner",
          lat: coords.lat,
          lng: coords.lng,
          label: "Delivery partner",
          status: trackingActive ? "Tracking active" : "Tracking paused",
          updatedAt: new Date().toISOString(),
        },
      ];

      const activeOrder = selectedOrderQuery.data;
      const effectiveCustomerEvent = customerLiveEvent ?? latestCustomerLocationQuery.data ?? null;

      if (typeof activeOrder?.restaurantLatitude === "number" && typeof activeOrder?.restaurantLongitude === "number") {
        nextMarkers.push({
          id: `restaurant-${activeOrder.restaurantId}`,
          type: "restaurant",
          lat: activeOrder.restaurantLatitude,
          lng: activeOrder.restaurantLongitude,
          label: "Pickup",
          status: "Restaurant",
        });
      }

      if (customerLiveMarker) {
        nextMarkers.push(customerLiveMarker);
      } else if (effectiveCustomerEvent) {
        nextMarkers.push({
          id: String(effectiveCustomerEvent.customerId ?? `customer-${selectedOrderId}`),
          type: "customer",
          lat: effectiveCustomerEvent.latitude,
          lng: effectiveCustomerEvent.longitude,
          label: "Customer (live)",
          status: "Live shared location",
          updatedAt: effectiveCustomerEvent.timestamp,
        });
      } else if (
        typeof activeOrder?.deliveryLatitude === "number" &&
        typeof activeOrder?.deliveryLongitude === "number"
      ) {
        nextMarkers.push({
          id: `customer-destination-${activeOrder.orderId}`,
          type: "customer",
          lat: activeOrder.deliveryLatitude,
          lng: activeOrder.deliveryLongitude,
          label: "Customer destination",
          status: activeOrder.deliveryAddress || "Drop location",
        });
      }

      return nextMarkers;
    },
    [
      coords.lat,
      coords.lng,
      customerLiveEvent,
      customerLiveMarker,
      deliveryPartnerId,
      latestCustomerLocationQuery.data,
      selectedOrderId,
      selectedOrderQuery.data,
      trackingActive,
    ],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Location tracking</h1>
      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Accepted order</label>
            <select
              value={selectedOrderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus-visible:border-[var(--color-brand)]"
            >
              <option value="">Select accepted order</option>
              {(acceptedOrdersQuery.data ?? []).map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  #{order.orderId} ({order.status.replaceAll("_", " ")})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Only your accepted orders can be tracked.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">H3 Index</label>
            <Input value={h3Index} onChange={(event) => setH3Index(event.target.value)} placeholder="Optional" />
          </div>
        </div>

        {acceptedOrdersQuery.data && acceptedOrdersQuery.data.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {acceptedOrdersQuery.data.map((order) => (
              <button
                key={`accepted-${order.orderId}`}
                type="button"
                onClick={() => setOrderId(order.orderId)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selectedOrderId === order.orderId
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-brand)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}
              >
                #{order.orderId}
              </button>
            ))}
          </div>
        ) : null}

        {acceptedOrdersQuery.data?.find((order) => order.orderId === selectedOrderId) ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-text-muted)]">Current order status:</span>
            <StatusBadge
              value={acceptedOrdersQuery.data.find((order) => order.orderId === selectedOrderId)?.status ?? "OUT_FOR_DELIVERY"}
              type="order"
            />
          </div>
        ) : null}

        {acceptedOrdersQuery.isSuccess && acceptedOrdersQuery.data.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            You have no accepted orders. Claim an order from Nearby Orders first.
          </p>
        ) : null}

        {selectedOrderId ? (
          <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-sm font-medium">Customer tracking for active order</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-muted)]">Connection:</span>
              <ConnectionBadge state={customerTrackingConnectionState} />
              <span className="text-[var(--color-text-muted)]">Last updated {customerTrackingUpdatedLabel}</span>
            </div>
            {customerLiveEvent || latestCustomerLocationQuery.data ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Customer live location available.
              </p>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                Waiting for customer live location. Customer must open their order tracking page and allow location.
              </p>
            )}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <p className="text-sm text-[var(--color-text-muted)]">Latitude: {coords.lat}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Longitude: {coords.lng}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (!selectedOrderId) {
                toast.error("Select an accepted order before starting tracking");
                return;
              }
              setTrackingActive(true);
              toast.success("Tracking started");
            }}
            disabled={trackingActive}
          >
            Start tracking
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTrackingActive(false);
              toast.success("Tracking stopped");
            }}
            disabled={!trackingActive}
          >
            Stop tracking
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (!selectedOrderId) {
                toast.error("Select an accepted order first");
                return;
              }
              locationMutation.mutate();
            }}
            isLoading={locationMutation.isPending}
            disabled={!selectedOrderId}
          >
            Send update now
          </Button>
        </div>
      </Card>

      <MapView markers={markers} zoom={14} />
    </div>
  );
}
