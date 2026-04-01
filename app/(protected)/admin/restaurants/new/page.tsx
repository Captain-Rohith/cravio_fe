"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createRestaurant } from "@/features/restaurants/api";
import { mapApiError } from "@/lib/api/error";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
});

type Values = z.infer<typeof schema>;

export default function CreateRestaurantPage() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });

  const mutation = useMutation({
    mutationFn: createRestaurant,
    onSuccess: (restaurant) => {
      toast.success(`Restaurant created: ${restaurant.name}`);
      form.reset();
      router.push(`/admin/restaurants/${restaurant.id}`);
    },
    onError: (error) => toast.error(mapApiError(error).message),
  });

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Create restaurant</h1>
      <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input placeholder="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
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
        <Button type="submit" isLoading={mutation.isPending}>
          Create
        </Button>
      </form>
    </Card>
  );
}
