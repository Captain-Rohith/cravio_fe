"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createRestaurantMenuItem,
  deleteRestaurant,
  deleteRestaurantMenuItem,
  getRestaurantById,
  getRestaurantMenu,
  updateRestaurant,
  updateRestaurantMenuItem,
} from "@/features/restaurants/api";
import { mapApiError } from "@/lib/api/error";
import { formatCurrency } from "@/lib/utils";

const restaurantSchema = z.object({
  name: z.string().min(2, "Name is required"),
  latitude: z.number(),
  longitude: z.number(),
});

const menuSchema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z.number().positive("Price must be greater than zero"),
});

type RestaurantValues = z.infer<typeof restaurantSchema>;
type MenuValues = z.infer<typeof menuSchema>;

export default function AdminRestaurantDetailPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const restaurantId = params.restaurantId;

  const [restaurantDeleteOpen, setRestaurantDeleteOpen] = useState(false);
  const [menuDeleteTarget, setMenuDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [menuEditTarget, setMenuEditTarget] = useState<{ id: string; name: string; price: number } | null>(null);

  const restaurantQuery = useQuery({
    queryKey: ["admin-restaurant", restaurantId],
    queryFn: () => getRestaurantById(restaurantId),
  });

  const menuQuery = useQuery({
    queryKey: ["admin-restaurant-menu", restaurantId],
    queryFn: () => getRestaurantMenu(restaurantId),
  });

  const restaurantForm = useForm<RestaurantValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });

  const addMenuForm = useForm<MenuValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  const editMenuForm = useForm<MenuValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  useEffect(() => {
    if (restaurantQuery.data) {
      restaurantForm.reset({
        name: restaurantQuery.data.name,
        latitude: restaurantQuery.data.latitude,
        longitude: restaurantQuery.data.longitude,
      });
    }
  }, [restaurantForm, restaurantQuery.data]);

  useEffect(() => {
    if (menuEditTarget) {
      editMenuForm.reset({
        name: menuEditTarget.name,
        price: menuEditTarget.price,
      });
    }
  }, [editMenuForm, menuEditTarget]);

  const updateRestaurantMutation = useMutation({
    mutationFn: (values: RestaurantValues) => updateRestaurant(restaurantId, values),
    onSuccess: () => {
      toast.success("Restaurant updated");
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants-nearby"] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: () => deleteRestaurant(restaurantId),
    onSuccess: () => {
      toast.success("Restaurant deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants-nearby"] });
      router.push("/admin/restaurants");
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const addMenuMutation = useMutation({
    mutationFn: (values: MenuValues) => createRestaurantMenuItem(restaurantId, values),
    onSuccess: () => {
      toast.success("Menu item added");
      addMenuForm.reset({ name: "", price: 0 });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-menu", restaurantId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ menuItemId, values }: { menuItemId: string; values: MenuValues }) =>
      updateRestaurantMenuItem(restaurantId, menuItemId, values),
    onSuccess: () => {
      toast.success("Menu item updated");
      setMenuEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-menu", restaurantId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (menuItemId: string) => deleteRestaurantMenuItem(restaurantId, menuItemId),
    onSuccess: () => {
      toast.success("Menu item deleted");
      setMenuDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-menu", restaurantId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Manage restaurant</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">ID: {restaurantId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/restaurants">
            <Button variant="outline">Back to restaurants</Button>
          </Link>
          <Button variant="danger" onClick={() => setRestaurantDeleteOpen(true)}>
            Delete restaurant
          </Button>
        </div>
      </header>

      {restaurantQuery.isLoading ? <Skeleton className="h-52" /> : null}
      {restaurantQuery.isError ? (
        <ErrorState description={mapApiError(restaurantQuery.error).message} onRetry={() => restaurantQuery.refetch()} />
      ) : null}

      {restaurantQuery.isSuccess ? (
        <Card className="max-w-3xl">
          <h2 className="text-xl font-semibold">Restaurant details</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={restaurantForm.handleSubmit((values) => updateRestaurantMutation.mutate(values))}
          >
            <Input
              placeholder="Restaurant name"
              {...restaurantForm.register("name")}
              error={restaurantForm.formState.errors.name?.message}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="number"
                step="0.000001"
                {...restaurantForm.register("latitude", { valueAsNumber: true })}
                error={restaurantForm.formState.errors.latitude?.message}
              />
              <Input
                type="number"
                step="0.000001"
                {...restaurantForm.register("longitude", { valueAsNumber: true })}
                error={restaurantForm.formState.errors.longitude?.message}
              />
            </div>
            <Button type="submit" isLoading={updateRestaurantMutation.isPending}>
              Save restaurant changes
            </Button>
          </form>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-xl font-semibold">Add menu item</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]"
          onSubmit={addMenuForm.handleSubmit((values) => addMenuMutation.mutate(values))}
        >
          <Input
            placeholder="Item name"
            {...addMenuForm.register("name")}
            error={addMenuForm.formState.errors.name?.message}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Price"
            {...addMenuForm.register("price", { valueAsNumber: true })}
            error={addMenuForm.formState.errors.price?.message}
          />
          <Button type="submit" isLoading={addMenuMutation.isPending}>
            Add
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Menu items</h2>
        {menuQuery.isLoading ? <Skeleton className="h-44" /> : null}
        {menuQuery.isError ? (
          <ErrorState description={mapApiError(menuQuery.error).message} onRetry={() => menuQuery.refetch()} />
        ) : null}

        {menuQuery.isSuccess && menuQuery.data.length === 0 ? (
          <EmptyState title="No menu items yet" description="Create the first menu item for this restaurant." />
        ) : null}

        {menuQuery.isSuccess && menuQuery.data.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {menuQuery.data.map((item) => (
              <Card key={item.id} className="space-y-3">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{formatCurrency(item.price)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">ID: {item.id}</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setMenuEditTarget({ id: item.id, name: item.name, price: item.price })}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => setMenuDeleteTarget({ id: item.id, name: item.name })}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        isOpen={restaurantDeleteOpen}
        title="Delete restaurant"
        description="This permanently removes the restaurant and all its menu items."
        confirmLabel="Delete"
        onCancel={() => setRestaurantDeleteOpen(false)}
        onConfirm={() => deleteRestaurantMutation.mutate()}
      />

      <ConfirmDialog
        isOpen={Boolean(menuDeleteTarget)}
        title="Delete menu item"
        description={`Remove ${menuDeleteTarget?.name ?? "this item"} from the menu?`}
        confirmLabel="Delete"
        onCancel={() => setMenuDeleteTarget(null)}
        onConfirm={() => {
          if (menuDeleteTarget) {
            deleteMenuMutation.mutate(menuDeleteTarget.id);
          }
        }}
      />

      {menuEditTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-xl">
            <h2 className="text-lg font-semibold">Edit menu item</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={editMenuForm.handleSubmit((values) =>
                updateMenuMutation.mutate({ menuItemId: menuEditTarget.id, values }),
              )}
            >
              <Input
                placeholder="Item name"
                {...editMenuForm.register("name")}
                error={editMenuForm.formState.errors.name?.message}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                {...editMenuForm.register("price", { valueAsNumber: true })}
                error={editMenuForm.formState.errors.price?.message}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMenuEditTarget(null)} type="button">
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateMenuMutation.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}