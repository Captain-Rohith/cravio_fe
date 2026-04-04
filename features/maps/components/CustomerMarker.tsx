"use client";

import { Marker, Popup } from "react-leaflet";
import L, { type DivIcon } from "leaflet";
import type { MapMarker } from "@/features/maps/types";

const customerIcon: DivIcon = L.divIcon({
  className: "map-pin map-pin--customer",
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
  html: '<span class="map-pin-core"><span class="map-pin-symbol">C</span></span>',
});

interface CustomerMarkerProps {
  marker: MapMarker;
}

export function CustomerMarker({ marker }: CustomerMarkerProps) {
  return (
    <Marker position={[marker.lat, marker.lng]} icon={customerIcon}>
      <Popup>
        <p className="text-sm font-semibold">{marker.label}</p>
        {marker.status ? <p className="text-xs text-zinc-600">{marker.status}</p> : null}
      </Popup>
    </Marker>
  );
}
