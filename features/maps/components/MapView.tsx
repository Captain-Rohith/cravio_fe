"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { MapMarker } from "@/features/maps/types";
import { DeliveryMarker } from "@/features/maps/components/DeliveryMarker";
import { RestaurantMarker } from "@/features/maps/components/RestaurantMarker";
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

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[var(--color-border)]", className)}>
      <MapContainer center={[fallbackCenter.lat, fallbackCenter.lng]} zoom={zoom} className="h-[420px] w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <RecenterMap center={fallbackCenter} />
        {markers.map((marker) =>
          marker.type === "restaurant" ? (
            <RestaurantMarker key={marker.id} marker={marker} onSelect={onMarkerSelect} />
          ) : (
            <DeliveryMarker key={marker.id} marker={marker} />
          ),
        )}
      </MapContainer>
    </div>
  );
}
