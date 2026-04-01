"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  const session = useAuthStore((state) => state.session);
  const cart = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const clearCart = useCartStore((state) => state.clearCart);

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
