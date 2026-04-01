"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getNearbyRestaurants } from "@/features/restaurants/api";
import { mapApiError } from "@/lib/api/error";

export default function AdminRestaurantsPage() {
  const [coordinates, setCoordinates] = useState({ latitude: 12.9716, longitude: 77.5946 });

  const query = useQuery({
    queryKey: ["admin-restaurants-nearby", coordinates],
    queryFn: () => getNearbyRestaurants(coordinates.latitude, coordinates.longitude),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Restaurant management</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Discover nearby restaurants and open each workspace for edit, delete, and menu operations.
          </p>
        </div>
        <Link href="/admin/restaurants/new">
          <Button>Create restaurant</Button>
        </Link>
      </header>

      <Card>
        <h2 className="text-lg font-semibold">Discovery coordinates</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          This backend currently provides nearby search for listing. Change coordinates to fetch a new cluster.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input
            type="number"
            step="0.000001"
            value={coordinates.latitude}
            onChange={(event) =>
              setCoordinates((prev) => ({ ...prev, latitude: Number(event.target.value) }))
            }
            placeholder="Latitude"
          />
          <Input
            type="number"
            step="0.000001"
            value={coordinates.longitude}
            onChange={(event) =>
              setCoordinates((prev) => ({ ...prev, longitude: Number(event.target.value) }))
            }
            placeholder="Longitude"
          />
          <Button variant="outline" onClick={() => query.refetch()}>
            Refresh
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : null}

      {query.isError ? (
        <ErrorState description={mapApiError(query.error).message} onRetry={() => query.refetch()} />
      ) : null}

      {query.isSuccess && query.data.length === 0 ? (
        <EmptyState
          title="No restaurants in this area"
          description="Try nearby coordinates or create a new restaurant first."
        />
      ) : null}

      {query.isSuccess && query.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((restaurant) => (
            <Card key={restaurant.id} className="space-y-3">
              <h3 className="text-lg font-semibold">{restaurant.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">ID: {restaurant.id}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {(restaurant.latitude ?? 0).toFixed(6)}, {(restaurant.longitude ?? 0).toFixed(6)}
              </p>
              {restaurant.address ? (
                <p className="text-sm text-[var(--color-text-muted)]">{restaurant.address}</p>
              ) : null}
              <Link href={`/admin/restaurants/${restaurant.id}`}>
                <Button variant="secondary">Manage restaurant</Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}