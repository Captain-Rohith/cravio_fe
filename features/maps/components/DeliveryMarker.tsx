"use client";

import { Marker, Popup } from "react-leaflet";
import L, { type DivIcon } from "leaflet";
import type { MapMarker } from "@/features/maps/types";

const deliveryIcon: DivIcon = L.divIcon({
  className: "map-pin map-pin--delivery",
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
  html: '<span class="map-pin-core"></span><span class="map-pin-pulse"></span>',
});

interface DeliveryMarkerProps {
  marker: MapMarker;
}

export function DeliveryMarker({ marker }: DeliveryMarkerProps) {
  return (
    <Marker position={[marker.lat, marker.lng]} icon={deliveryIcon}>
      <Popup>
        <p className="text-sm font-semibold">{marker.label}</p>
        {marker.status ? <p className="text-xs text-zinc-600">{marker.status}</p> : null}
      </Popup>
    </Marker>
  );
}
