"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  deleteRestaurantMenuItem,
  getRestaurantMenu,
  updateRestaurantMenuItem,
} from "@/features/restaurants/api";
import { useRestaurantId } from "@/hooks/use-restaurant-id";
import { mapApiError } from "@/lib/api/error";
import { formatCurrency } from "@/lib/utils";

const itemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  price: z.number().positive("Price must be greater than zero"),
});

type ItemValues = z.infer<typeof itemSchema>;

export default function RestaurantMenuPage() {
  const queryClient = useQueryClient();
  const { restaurantId, setRestaurantId } = useRestaurantId();
  const normalizedRestaurantId = restaurantId.trim();
  const hasRestaurantProfileId = /^\d+$/.test(normalizedRestaurantId);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; price: number } | null>(null);

  const addForm = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", price: 0 },
  });

  const editForm = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", price: 0 },
  });

  const menuQuery = useQuery({
    enabled: hasRestaurantProfileId,
    queryKey: ["restaurant-owned-menu", normalizedRestaurantId],
    queryFn: () => getRestaurantMenu(normalizedRestaurantId),
  });

  const menuError = menuQuery.isError ? mapApiError(menuQuery.error) : null;
  const profileMissing = menuError?.statusCode === 404;
  const canManageMenu = hasRestaurantProfileId && !profileMissing;

  useEffect(() => {
    if (!editTarget) {
      return;
    }

    editForm.reset({
      name: editTarget.name,
      price: editTarget.price,
    });
  }, [editForm, editTarget]);

  const addMutation = useMutation({
    mutationFn: (values: ItemValues) => createRestaurantMenuItem(normalizedRestaurantId, values),
    onSuccess: () => {
      toast.success("Menu item created");
      addForm.reset({ name: "", price: 0 });
      queryClient.invalidateQueries({ queryKey: ["restaurant-owned-menu", normalizedRestaurantId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ItemValues }) =>
      updateRestaurantMenuItem(normalizedRestaurantId, id, values),
    onSuccess: () => {
      toast.success("Menu item updated");
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["restaurant-owned-menu", normalizedRestaurantId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (menuItemId: string) => deleteRestaurantMenuItem(normalizedRestaurantId, menuItemId),
    onSuccess: () => {
      toast.success("Menu item deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["restaurant-owned-menu", normalizedRestaurantId] });
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Menu management</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Manage your restaurant menu items from one place.
        </p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Restaurant scope</h2>
        <Input
          value={restaurantId}
          onChange={(event) => setRestaurantId(event.target.value)}
          placeholder="Restaurant ID"
          inputMode="numeric"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Use your restaurant profile ID from create response `response.data.id`.
        </p>
      </Card>

      {!hasRestaurantProfileId ? (
        <Card className="space-y-3 border-[var(--color-brand)]/40">
          <h2 className="text-lg font-semibold">Restaurant profile ID required</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Auth user ID is different from restaurant profile ID. Create or link your restaurant profile first.
          </p>
          <Link href="/restaurant/location">
            <Button>Open location and create/link profile</Button>
          </Link>
        </Card>
      ) : null}

      {hasRestaurantProfileId && profileMissing ? (
        <Card className="space-y-3 border-[var(--color-brand)]/40">
          <h2 className="text-lg font-semibold">Restaurant profile not found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Create or link your restaurant profile first, then menu management will become available.
          </p>
          <Link href="/restaurant/location">
            <Button>Open location and create profile</Button>
          </Link>
        </Card>
      ) : null}

      {canManageMenu ? (
        <Card>
          <h2 className="text-lg font-semibold">Add menu item</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]"
            onSubmit={addForm.handleSubmit((values) => addMutation.mutate(values))}
          >
            <Input placeholder="Item name" {...addForm.register("name")} error={addForm.formState.errors.name?.message} />
            <Input
              type="number"
              step="0.01"
              placeholder="Price"
              {...addForm.register("price", { valueAsNumber: true })}
              error={addForm.formState.errors.price?.message}
            />
            <Button type="submit" isLoading={addMutation.isPending}>Add</Button>
          </form>
        </Card>
      ) : null}

      {menuQuery.isLoading ? <Skeleton className="h-44" /> : null}
      {menuQuery.isError && !profileMissing ? (
        <ErrorState description={menuError?.message ?? "Unable to load menu"} onRetry={() => menuQuery.refetch()} />
      ) : null}
      {menuQuery.isSuccess && menuQuery.data.length === 0 ? (
        <EmptyState title="No menu items" description="Create your first menu item to start receiving customer orders." />
      ) : null}

      {menuQuery.isSuccess && menuQuery.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {menuQuery.data.map((item) => (
            <Card key={item.id} className="space-y-3">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{formatCurrency(item.price)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">ID: {item.id}</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditTarget({ id: item.id, name: item.name, price: item.price })}>Edit</Button>
                <Button variant="danger" onClick={() => setDeleteTarget({ id: item.id, name: item.name })}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete menu item"
        description={`Remove ${deleteTarget?.name ?? "this item"} from your menu?`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />

      {editTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-xl">
            <h2 className="text-lg font-semibold">Edit menu item</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={editForm.handleSubmit((values) => editMutation.mutate({ id: editTarget.id, values }))}
            >
              <Input
                placeholder="Item name"
                {...editForm.register("name")}
                error={editForm.formState.errors.name?.message}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                {...editForm.register("price", { valueAsNumber: true })}
                error={editForm.formState.errors.price?.message}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={editMutation.isPending}>
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
