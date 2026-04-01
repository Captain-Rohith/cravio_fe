"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { getRestaurantMenu } from "@/features/restaurants/api";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { mapApiError } from "@/lib/api/error";

export default function RestaurantDetailPage() {
  const params = useParams<{ restaurantId: string }>();
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const query = useQuery({
    queryKey: ["restaurant-menu", params.restaurantId],
    queryFn: () => getRestaurantMenu(params.restaurantId),
  });

  return (
    <AppShell>
      <div className="page-enter space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">Restaurant menu</h1>
          <Link href="/customer/cart">
            <Button variant="outline">Go to cart ({cartCount})</Button>
          </Link>
        </header>

        {query.isLoading ? <Skeleton className="h-64" /> : null}
        {query.isError ? <ErrorState description={mapApiError(query.error).message} /> : null}

        {query.isSuccess && query.data.length === 0 ? (
          <EmptyState title="No menu items" description="This restaurant has no active menu items yet." />
        ) : null}

        {query.isSuccess && query.data.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="grid gap-4 md:grid-cols-2">
              {query.data.map((item) => (
                <Card key={item.id} className="space-y-3">
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {item.description ?? "Signature item"}
                  </p>
                  <p className="text-sm font-semibold">{formatCurrency(item.price)}</p>
                  <Button
                    onClick={() => {
                      setRestaurant(params.restaurantId);
                      addItem(item);
                    }}
                  >
                    Add to cart
                  </Button>
                </Card>
              ))}
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="space-y-3">
                <h2 className="text-xl font-semibold">Cart preview</h2>
                {cartItems.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No items yet. Add from menu to preview here.</p>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.menuItemId} className="rounded-xl border border-[var(--color-border)] p-3">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <p className="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2">
                      <p className="text-sm text-[var(--color-text-muted)]">Total</p>
                      <p className="font-semibold">{formatCurrency(cartTotal)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearCart}>Clear</Button>
                      <Link href="/customer/checkout" className="flex-1">
                        <Button className="w-full">Checkout</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            </aside>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
