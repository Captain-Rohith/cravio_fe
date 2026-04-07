"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNearbyRestaurants } from "@/features/restaurants/api";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import type { MapMarker } from "@/features/maps/types";
import { mapApiError } from "@/lib/api/error";
import { useAuthStore } from "@/store/auth-store";
import type { Restaurant } from "@/types/dto";

const MapView = dynamic(
  () => import("@/features/maps/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
    ),
  },
);

export default function RestaurantDiscoveryPage() {
  const session = useAuthStore((state) => state.session);
  const [coordinates, setCoordinates] = useState({ latitude: 12.9716, longitude: 77.5946 });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["restaurants", coordinates],
    queryFn: () => getNearbyRestaurants(coordinates.latitude, coordinates.longitude),
  });

  const detectLocation = () => {
  console.log("Clicked location button");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("SUCCESS", position.coords);

      setCoordinates({
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      });
    },
    (error) => {
      console.error("GEO ERROR", error);
      alert(error.message);
    }
  );
};

  const normalizeRestaurants = (payload: unknown): Restaurant[] => {
    if (Array.isArray(payload)) {
      return payload as Restaurant[];
    }

    if (
      payload &&
      typeof payload === "object" &&
      "items" in payload &&
      Array.isArray((payload as { items?: unknown }).items)
    ) {
      return (payload as { items: Restaurant[] }).items;
    }

    return [];
  };

  const restaurants = normalizeRestaurants(query.data);

  const restaurantMarkers: MapMarker[] = restaurants.map((restaurant) => ({
    id: restaurant.id,
    type: "restaurant",
    lat: restaurant.latitude,
    lng: restaurant.longitude,
    label: restaurant.name,
    status: restaurant.address ?? "Active",
  }));

  const customerMarker: MapMarker = {
    id: "customer-search-origin",
    type: "customer",
    lat: coordinates.latitude,
    lng: coordinates.longitude,
    label: "You",
    status: "Search location",
  };

  return (
    <AppShell>
      <div className="page-enter space-y-6">
        {session?.user.role === "RESTAURANT" ? (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-[var(--color-brand)]/40 bg-[var(--color-panel)]">
            <div>
              <h2 className="text-lg font-semibold">Restaurant account detected</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Your management tools are available in the restaurant workspace.
              </p>
            </div>
            <Link href="/restaurant">
              <Button>Manage my restaurant</Button>
            </Link>
          </Card>
        ) : null}

        <header className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
          <div className="w-full md:w-48">
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <Input
              type="number"
              step="0.000001"
              value={coordinates.latitude}
              onChange={(event) =>
                setCoordinates((prev) => ({ ...prev, latitude: Number(event.target.value) }))
              }
            />
          </div>
          <div className="w-full md:w-48">
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <Input
              type="number"
              step="0.000001"
              value={coordinates.longitude}
              onChange={(event) =>
                setCoordinates((prev) => ({ ...prev, longitude: Number(event.target.value) }))
              }
            />
          </div>
          <Button onClick={detectLocation} variant="outline">
            Use current location
          </Button>
        </header>

        <MapView
          center={{ lat: coordinates.latitude, lng: coordinates.longitude }}
          markers={[customerMarker, ...restaurantMarkers]}
          onMarkerSelect={setSelectedMarkerId}
        />

        {query.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : null}

        {query.isError ? (
          <ErrorState description={mapApiError(query.error).message} onRetry={() => query.refetch()} />
        ) : null}

        {query.isSuccess && restaurants.length === 0 ? (
          <EmptyState
            title="No restaurants available"
            description="Try a nearby coordinate range to discover active restaurants."
          />
        ) : null}

        {query.isSuccess && restaurants.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="space-y-2">
                <h2 className="text-lg font-semibold">{restaurant.name}</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {restaurant.description ?? "Fresh meals available near your location."}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {restaurant.address ?? "Address unavailable"}
                </p>
                {selectedMarkerId === restaurant.id ? (
                  <p className="text-xs font-semibold text-[var(--color-brand)]">Selected on map</p>
                ) : null}
                <Link href={`/restaurants/${restaurant.id}`}>
                  <Button className="mt-2" variant="secondary">
                    View menu
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
