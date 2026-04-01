"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createRestaurantMenuItem } from "@/features/restaurants/api";
import { mapApiError } from "@/lib/api/error";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2),
  price: z.number().min(1),
});

type Values = z.infer<typeof schema>;

export default function AddMenuItemPage() {
  const params = useParams<{ restaurantId: string }>();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      createRestaurantMenuItem(params.restaurantId, values),
    onSuccess: () => {
      toast.success("Menu item added");
      form.reset();
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Add menu item</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Restaurant ID: {params.restaurantId}</p>
      <Link href={`/admin/restaurants/${params.restaurantId}`} className="mt-2 inline-block text-sm text-[var(--color-brand)]">
        Switch to full management view
      </Link>
      <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input placeholder="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
        <Input
          type="number"
          step="0.01"
          placeholder="Price"
          {...form.register("price", { valueAsNumber: true })}
          error={form.formState.errors.price?.message}
        />
        <Button type="submit" isLoading={mutation.isPending}>
          Add item
        </Button>
      </form>
    </Card>
  );
}
