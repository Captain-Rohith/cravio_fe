"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createRestaurant, getRestaurantById, updateRestaurant } from "@/features/restaurants/api";
import { useRestaurantId } from "@/hooks/use-restaurant-id";
import { mapApiError } from "@/lib/api/error";

const schema = z.object({
  name: z.string().min(2, "Restaurant name is required"),
  latitude: z.number(),
  longitude: z.number(),
});

type Values = z.infer<typeof schema>;

export default function RestaurantLocationPage() {
  const queryClient = useQueryClient();
  const { restaurantId, setRestaurantId } = useRestaurantId();
  const hasRestaurantProfileId = restaurantId.trim().length > 0;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });

  const restaurantQuery = useQuery({
    enabled: hasRestaurantProfileId,
    queryKey: ["restaurant-owned-profile", restaurantId],
    queryFn: () => getRestaurantById(restaurantId),
  });

  useEffect(() => {
    if (!restaurantQuery.data) {
      return;
    }

    form.reset({
      name: restaurantQuery.data.name,
      latitude: restaurantQuery.data.latitude,
      longitude: restaurantQuery.data.longitude,
    });
  }, [form, restaurantQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (values: Values) => updateRestaurant(restaurantId, values),
    onSuccess: () => {
      toast.success("Restaurant location updated");
      queryClient.invalidateQueries({ queryKey: ["restaurant-owned-profile", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const createMutation = useMutation({
    mutationFn: (values: Values) => createRestaurant(values),
    onSuccess: (restaurant) => {
      if (!restaurant.id) {
        toast.error("Profile was created but restaurant ID was not returned. Please check backend response.");
        return;
      }

      toast.success("Restaurant profile created");
      setRestaurantId(String(restaurant.id));
      queryClient.invalidateQueries({ queryKey: ["restaurant-owned-profile"] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const profileMissing = restaurantQuery.isError && mapApiError(restaurantQuery.error).statusCode === 404;
  const needsProfileCreate = !hasRestaurantProfileId || profileMissing;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Location settings</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Keep your restaurant coordinates accurate for nearby customer discovery.
        </p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Restaurant scope</h2>
        <Input
          value={restaurantId}
          onChange={(event) => setRestaurantId(event.target.value)}
          placeholder="Restaurant ID"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Use your restaurant profile ID from create response `response.data.id`.
        </p>
      </Card>

      {!hasRestaurantProfileId ? (
        <Card className="space-y-2 border-[var(--color-brand)]/40">
          <h2 className="text-lg font-semibold">No restaurant profile linked</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Fill the form and click Create profile. This will save restaurant profile ID for menu and order APIs.
          </p>
        </Card>
      ) : null}

      {restaurantQuery.isLoading ? <Skeleton className="h-52" /> : null}
      {restaurantQuery.isError && !profileMissing && hasRestaurantProfileId ? (
        <ErrorState description={mapApiError(restaurantQuery.error).message} onRetry={() => restaurantQuery.refetch()} />
      ) : null}

      <Card className="max-w-3xl">
        <h2 className="text-xl font-semibold">Restaurant profile and coordinates</h2>
        <form className="mt-4 space-y-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
          <Input placeholder="Restaurant name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              step="0.000001"
              {...form.register("latitude", { valueAsNumber: true })}
              error={form.formState.errors.latitude?.message}
            />
            <Input
              type="number"
              step="0.000001"
              {...form.register("longitude", { valueAsNumber: true })}
              error={form.formState.errors.longitude?.message}
            />
          </div>
          {needsProfileCreate ? (
            <Button
              type="button"
              isLoading={createMutation.isPending}
              onClick={form.handleSubmit((values) => createMutation.mutate(values))}
            >
              Create profile
            </Button>
          ) : (
            <Button type="submit" isLoading={updateMutation.isPending}>Save location</Button>
          )}
        </form>
      </Card>
    </div>
  );
}
