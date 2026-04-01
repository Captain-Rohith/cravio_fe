"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useOrderTracking } from "@/features/tracking/hooks/useOrderTracking";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "@/features/orders/api";
import { formatDateTime } from "@/lib/utils";
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

export default function LiveTrackingPage() {
  const params = useParams<{ orderId: string }>();
  const { latestEvent, connectionState, deliveryMarker, lastUpdatedLabel } = useOrderTracking(
    params.orderId,
  );

  const orderQuery = useQuery({
    queryKey: ["tracking-order", params.orderId],
    queryFn: () => getOrderById(params.orderId),
    refetchInterval: 15000,
  });

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

  if (deliveryMarker) {
    markers.push(deliveryMarker);
  }

  const mapCenter = deliveryMarker
    ? { lat: deliveryMarker.lat, lng: deliveryMarker.lng }
    : markers[0]
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : undefined;

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold">Live order tracking</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Order ID: {params.orderId}</p>
        {orderQuery.data ? <StatusBadge value={orderQuery.data.status} type="order" /> : null}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-text-muted)]">Connection:</span>
          <ConnectionBadge state={connectionState} />
          <span className="text-[var(--color-text-muted)]">Last updated {lastUpdatedLabel}</span>
        </div>
      </Card>

      <MapView markers={markers} center={mapCenter} zoom={15} />

      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Latest location event</h2>
        {latestEvent ? (
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt>Latitude</dt>
              <dd>{latestEvent.latitude}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Longitude</dt>
              <dd>{latestEvent.longitude}</dd>
            </div>
            <div className="flex justify-between">
              <dt>H3 index</dt>
              <dd>{latestEvent.h3Index ?? "Unavailable"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Timestamp</dt>
              <dd>{formatDateTime(latestEvent.timestamp)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Waiting for tracking updates.</p>
        )}
      </Card>
    </div>
  );
}
