"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import type { MapMarker } from "@/features/maps/types";
import { DeliveryMarker } from "@/features/maps/components/DeliveryMarker";
import { RestaurantMarker } from "@/features/maps/components/RestaurantMarker";
import { CustomerMarker } from "@/features/maps/components/CustomerMarker";
import { cn } from "@/lib/utils";

interface MapViewProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMarkerSelect?: (markerId: string) => void;
}

function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center.lat, center.lng, map]);

  return null;
}

function FitMapToMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length < 2) {
      return;
    }

    const bounds = latLngBounds(
      markers.map((marker) => [marker.lat, marker.lng] as [number, number]),
    );

    map.fitBounds(bounds.pad(0.2));
  }, [map, markers]);

  return null;
}

export function MapView({ markers, center, zoom = 14, className, onMarkerSelect }: MapViewProps) {
  const fallbackCenter = useMemo(() => {
    if (center) {
      return center;
    }

    if (markers[0]) {
      return { lat: markers[0].lat, lng: markers[0].lng };
    }

    return { lat: 12.9716, lng: 77.5946 };
  }, [center, markers]);

  const markerTypeLabels = useMemo(
    () => ({
      restaurant: "Restaurant (R)",
      "delivery-partner": "Delivery partner (D)",
      customer: "Customer (C)",
    }),
    [],
  );

  const markerTypeColorClass = useMemo(
    () => ({
      restaurant: "bg-zinc-500",
      "delivery-partner": "bg-[var(--color-brand)]",
      customer: "bg-blue-600",
    }),
    [],
  );

  const activeMarkerTypes = useMemo(
    () =>
      Array.from(new Set(markers.map((marker) => marker.type))),
    [markers],
  );

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border border-[var(--color-border)]", className)}
      role="img"
      aria-label="Map with role markers for restaurant, delivery partner, and customer."
    >
      <MapContainer center={[fallbackCenter.lat, fallbackCenter.lng]} zoom={zoom} className="h-[420px] w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <RecenterMap center={fallbackCenter} />
        {!center ? <FitMapToMarkers markers={markers} /> : null}
        {markers.map((marker) => {
          if (marker.type === "restaurant") {
            return <RestaurantMarker key={marker.id} marker={marker} onSelect={onMarkerSelect} />;
          }

          if (marker.type === "customer") {
            return <CustomerMarker key={marker.id} marker={marker} />;
          }

          return <DeliveryMarker key={marker.id} marker={marker} />;
        })}
      </MapContainer>
      {activeMarkerTypes.length > 0 ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)]/95 px-3 py-2 text-xs shadow-sm">
          <p className="mb-1 font-semibold">Map legend</p>
          <div className="space-y-1">
            {activeMarkerTypes.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", markerTypeColorClass[type])} />
                <span>{markerTypeLabels[type]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
