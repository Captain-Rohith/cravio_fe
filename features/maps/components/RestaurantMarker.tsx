"use client";

import { Marker, Popup } from "react-leaflet";
import L, { type DivIcon } from "leaflet";
import type { MapMarker } from "@/features/maps/types";

const restaurantIcon: DivIcon = L.divIcon({
  className: "map-pin map-pin--restaurant",
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
  html: '<span class="map-pin-core"></span>',
});

interface RestaurantMarkerProps {
  marker: MapMarker;
  onSelect?: (markerId: string) => void;
}

export function RestaurantMarker({ marker, onSelect }: RestaurantMarkerProps) {
  return (
    <Marker
      position={[marker.lat, marker.lng]}
      icon={restaurantIcon}
      eventHandlers={{
        click: () => onSelect?.(marker.id),
      }}
    >
      <Popup>
        <p className="text-sm font-semibold">{marker.label}</p>
        {marker.status ? <p className="text-xs text-zinc-600">{marker.status}</p> : null}
      </Popup>
    </Marker>
  );
}
