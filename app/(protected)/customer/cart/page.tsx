"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse restaurants and add menu items to start checkout."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Cart</h1>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.menuItemId} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">{formatCurrency(item.unitPrice)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>
                -
              </Button>
              <span>{item.quantity}</span>
              <Button variant="outline" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>
                +
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="flex items-center justify-between">
        <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
        <Link href="/customer/checkout">
          <Button>Proceed to checkout</Button>
        </Link>
      </Card>
    </div>
  );
}
