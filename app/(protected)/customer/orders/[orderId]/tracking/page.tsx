"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrderTracking } from "@/features/tracking/hooks/useOrderTracking";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getOrderById } from "@/features/orders/api";
import { isCustomerTrackingAvailable } from "@/features/orders/tracking";
import { getLatestTrackingEvent, sendCustomerLocationUpdate } from "@/features/tracking/api";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { mapApiError } from "@/lib/api/error";
import { formatDateTime } from "@/lib/utils";
import type { MapMarker } from "@/features/maps/types";
import { toast } from "sonner";

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

export default function LiveTrackingPage() {
  const params = useParams<{ orderId: string }>();
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSharingState, setLocationSharingState] = useState<
    "idle" | "requesting" | "enabled" | "denied" | "unsupported"
  >("idle");
  const [locationSharingError, setLocationSharingError] = useState<string | null>(null);
  const [locationPushStatus, setLocationPushStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const [locationPushMessage, setLocationPushMessage] = useState<string>("Not sent yet");
  const watchIdRef = useRef<number | null>(null);
  const orderQuery = useQuery({
    queryKey: ["tracking-order", params.orderId],
    queryFn: () => getOrderById(params.orderId),
    refetchInterval: 10000,
  });
  const trackingAvailable = isCustomerTrackingAvailable(orderQuery.data);
  const { latestEvent, connectionState, deliveryMarker, lastUpdatedLabel } = useOrderTracking(
    trackingAvailable ? params.orderId : null,
  );
  const latestSnapshotQuery = useQuery({
    enabled: trackingAvailable,
    queryKey: ["tracking-latest", params.orderId],
    queryFn: () => getLatestTrackingEvent(params.orderId),
    refetchInterval: 10000,
  });
  const customerLocationMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      sendCustomerLocationUpdate({
        orderId: params.orderId,
        latitude: coords.lat,
        longitude: coords.lng,
      }),
    onMutate: () => {
      setLocationPushStatus("sending");
      setLocationPushMessage("Sending location to server...");
    },
    onSuccess: () => {
      setLocationPushStatus("sent");
      setLocationPushMessage(`Last sent at ${new Date().toLocaleTimeString()}`);
    },
    onError: (error) => {
      const message = mapApiError(error).message;
      setLocationPushStatus("failed");
      setLocationPushMessage(message);
      toast.error(message);
    },
  });
  const mutateCustomerLocation = customerLocationMutation.mutate;

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startLocationSharing = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationSharingState("unsupported");
      setLocationSharingError("Geolocation is not supported in this browser.");
      return;
    }

    setLocationSharingState("requesting");
    setLocationSharingError(null);
    setLocationPushStatus("idle");
    setLocationPushMessage("Waiting for first GPS fix...");

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCustomerCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setLocationSharingState("enabled");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationSharingState("denied");
          setLocationSharingError("Location permission denied. Please allow location access in browser settings.");
          return;
        }

        setLocationSharingState("idle");
        setLocationSharingError("Unable to read your location right now. Please try again.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  };

  useEffect(() => {
    if (!trackingAvailable || !customerCoords) {
      return;
    }

    mutateCustomerLocation(customerCoords);
    const interval = setInterval(() => mutateCustomerLocation(customerCoords), 12000);

    return () => clearInterval(interval);
  }, [customerCoords, trackingAvailable, mutateCustomerLocation]);

  const sendLocationNow = () => {
    if (!trackingAvailable) {
      toast.error("Tracking is not available until delivery partner accepts the order.");
      return;
    }

    if (!customerCoords) {
      toast.error("Location is not available yet. Enable location sharing first.");
      return;
    }

    mutateCustomerLocation(customerCoords);
  };

  if (orderQuery.isLoading) {
    return (
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold">Live order tracking</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Checking tracking availability...</p>
      </Card>
    );
  }

  if (orderQuery.isError) {
    return <ErrorState description={mapApiError(orderQuery.error).message} />;
  }

  const effectiveLatestEvent = latestEvent ?? latestSnapshotQuery.data ?? null;

  const effectiveDeliveryMarker =
    deliveryMarker ??
    (effectiveLatestEvent
      ? {
          id: String(effectiveLatestEvent.deliveryPartnerId ?? `order-${params.orderId}`),
          type: "delivery-partner" as const,
          lat: effectiveLatestEvent.latitude,
          lng: effectiveLatestEvent.longitude,
          label: "Delivery partner",
          status: "Latest known location",
          updatedAt: effectiveLatestEvent.timestamp,
        }
      : null);

  const markers: MapMarker[] = [];

  if (orderQuery.data?.restaurantLatitude && orderQuery.data?.restaurantLongitude) {
    markers.push({
      id: `restaurant-${orderQuery.data.restaurantId}`,
      type: "restaurant",
      lat: orderQuery.data.restaurantLatitude,
      lng: orderQuery.data.restaurantLongitude,
      label: "Restaurant",
      status: "Pickup point",
    });
  }

  if (effectiveDeliveryMarker) {
    markers.push(effectiveDeliveryMarker);
  }

  if (customerCoords) {
    markers.push({
      id: "customer-self",
      type: "customer",
      lat: customerCoords.lat,
      lng: customerCoords.lng,
      label: "You",
      status: "Customer location",
      updatedAt: new Date().toISOString(),
    });
  }

  const mapCenter = effectiveDeliveryMarker
    ? { lat: effectiveDeliveryMarker.lat, lng: effectiveDeliveryMarker.lng }
    : markers[0]
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : undefined;

  if (!orderQuery.isLoading && orderQuery.data && !trackingAvailable) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold">Live order tracking</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Order ID: {params.orderId}</p>
        <StatusBadge value={orderQuery.data.status} type="order" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Tracking will be enabled as soon as a delivery partner accepts this order.
        </p>
        <div className="flex gap-3">
          <Link href={`/customer/orders/${params.orderId}`}>
            <Button variant="outline">Back to order details</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold">Live order tracking</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Order ID: {params.orderId}</p>
        {orderQuery.data ? <StatusBadge value={orderQuery.data.status} type="order" /> : null}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-text-muted)]">Connection:</span>
          <ConnectionBadge state={connectionState} />
          <span className="text-[var(--color-text-muted)]">
            Last updated {latestEvent ? lastUpdatedLabel : effectiveLatestEvent ? "from latest snapshot" : lastUpdatedLabel}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={locationSharingState === "enabled" ? "secondary" : undefined}
              onClick={startLocationSharing}
              disabled={locationSharingState === "requesting"}
            >
              {locationSharingState === "enabled"
                ? "Location sharing enabled"
                : locationSharingState === "requesting"
                  ? "Requesting permission..."
                  : "Enable location sharing"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={sendLocationNow}
              disabled={locationSharingState !== "enabled" || customerLocationMutation.isPending}
            >
              Send location now
            </Button>
            <span className="text-xs text-[var(--color-text-muted)]">
              Required for delivery partner to see your live location.
            </span>
          </div>
          {locationSharingError ? (
            <p className="mt-2 text-xs text-red-500">{locationSharingError}</p>
          ) : locationSharingState === "enabled" ? (
            <p className="mt-2 text-xs text-emerald-500">Location sharing is active.</p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Server push status:{" "}
            <span
              className={
                locationPushStatus === "sent"
                  ? "text-emerald-500"
                  : locationPushStatus === "failed"
                    ? "text-red-500"
                    : "text-[var(--color-text-muted)]"
              }
            >
              {locationPushMessage}
            </span>
          </p>
        </div>
      </Card>

      <MapView markers={markers} center={mapCenter} zoom={15} />

      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Latest location event</h2>
        {effectiveLatestEvent ? (
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt>Latitude</dt>
              <dd>{effectiveLatestEvent.latitude}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Longitude</dt>
              <dd>{effectiveLatestEvent.longitude}</dd>
            </div>
            <div className="flex justify-between">
              <dt>H3 index</dt>
              <dd>{effectiveLatestEvent.h3Index ?? "Unavailable"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Timestamp</dt>
              <dd>{formatDateTime(effectiveLatestEvent.timestamp)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Waiting for tracking updates.</p>
        )}
      </Card>
    </div>
  );
}
