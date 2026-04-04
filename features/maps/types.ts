export type MarkerType = "restaurant" | "delivery-partner" | "customer";

export type MapMarker = {
  id: string;
  type: MarkerType;
  lat: number;
  lng: number;
  label: string;
  status?: string;
  updatedAt?: string;
};
