"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createOrder } from "@/features/orders/api";
import { mapApiError } from "@/lib/api/error";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(10, "Provide a complete delivery address"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const session = useAuthStore((state) => state.session);
  const cart = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDestinationCoords({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setDestinationCoords(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CheckoutValues) => {
      const invalidRestaurantId =
        !restaurantId || restaurantId === "undefined" || restaurantId === "null";

      if (!session?.user.id || invalidRestaurantId) {
        throw new Error("Cart session is invalid. Add items again.");
      }

      const order = await createOrder({
        customerId: session.user.id,
        restaurantId,
        deliveryAddress: values.deliveryAddress,
        deliveryLatitude: destinationCoords?.latitude,
        deliveryLongitude: destinationCoords?.longitude,
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      });

      return order;
    },
    onSuccess: (order) => {
      const orderId = order.orderId || order.id;
      if (!orderId || orderId === "undefined" || orderId === "null") {
        toast.error("Order placed but order ID is invalid. Please check order history.");
        router.push("/customer/orders");
        return;
      }

      toast.success("Order placed successfully");
      clearCart();
      router.push(`/customer/orders/${orderId}/confirmation`);
    },
    onError: (error) => {
      toast.error(mapApiError(error).message);
    },
  });

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Confirm delivery details and process payment.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-sm font-medium">Customer location for delivery</p>
          {destinationCoords ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {destinationCoords.latitude}, {destinationCoords.longitude}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Location unavailable. You can still place the order with address only.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => {
              if (!navigator.geolocation) {
                toast.error("Geolocation is not supported in this browser");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (position) =>
                  setDestinationCoords({
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6)),
                  }),
                () => toast.error("Unable to fetch current location"),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
              );
            }}
          >
            Use current location
          </Button>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Delivery address</label>
          <Input
            {...form.register("deliveryAddress")}
            error={form.formState.errors.deliveryAddress?.message}
          />
        </div>
        <Button type="submit" isLoading={mutation.isPending}>
          Place order
        </Button>
      </form>
    </Card>
  );
}
