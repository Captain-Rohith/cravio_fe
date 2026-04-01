"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pushLocationUpdate } from "@/features/tracking/api/pushLocationUpdate";
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

export default function DeliveryTrackingPage() {
  const deliveryPartnerId = useAuthStore((state) => state.session?.user.id) ?? "";
  const [orderId, setOrderId] = useState("");
  const [trackingActive, setTrackingActive] = useState(false);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [h3Index, setH3Index] = useState("");

  const locationMutation = useMutation({
    mutationFn: () =>
      pushLocationUpdate({
        orderId,
        deliveryPartnerId,
        latitude: coords.lat,
        longitude: coords.lng,
        h3Index: h3Index || undefined,
      }),
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
    if (!trackingActive || !orderId) {
      return;
    }

    const interval = setInterval(() => {
      locationMutation.mutate();
    }, 10000);

    return () => clearInterval(interval);
  }, [locationMutation, orderId, trackingActive]);

  const markers = useMemo<MapMarker[]>(
    () => [
      {
        id: `delivery-${deliveryPartnerId}`,
        type: "delivery-partner",
        lat: coords.lat,
        lng: coords.lng,
        label: "Delivery partner",
        status: trackingActive ? "Tracking active" : "Tracking paused",
        updatedAt: new Date().toISOString(),
      },
    ],
    [coords.lat, coords.lng, deliveryPartnerId, trackingActive],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Location tracking</h1>
      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Order ID</label>
            <Input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="order-123" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">H3 Index</label>
            <Input value={h3Index} onChange={(event) => setH3Index(event.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <p className="text-sm text-[var(--color-text-muted)]">Latitude: {coords.lat}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Longitude: {coords.lng}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (!orderId) {
                toast.error("Enter order ID before starting tracking");
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
            onClick={() => locationMutation.mutate()}
            isLoading={locationMutation.isPending}
            disabled={!orderId}
          >
            Send update now
          </Button>
        </div>
      </Card>

      <MapView markers={markers} center={{ lat: coords.lat, lng: coords.lng }} zoom={16} />
    </div>
  );
}
