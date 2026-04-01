"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function RestaurantOverviewPage() {
  const session = useAuthStore((state) => state.session);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Restaurant workspace</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Manage your menu, process order lifecycle updates, and maintain your live restaurant location.
        </p>
      </header>

      <Card>
        <h2 className="text-lg font-semibold">Signed in identity</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          User ID: {session?.user.id ?? "Unavailable"}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">Role: {session?.user.role ?? "Unavailable"}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-lg font-semibold">Menu items</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Add, update, and remove menu entries with real pricing.
          </p>
          <Link href="/restaurant/menu" className="mt-4 inline-block">
            <Button variant="secondary">Open menu manager</Button>
          </Link>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Order status</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Open any incoming order and move it through preparation and handoff states.
          </p>
          <Link href="/restaurant/orders" className="mt-4 inline-block">
            <Button variant="secondary">Open order manager</Button>
          </Link>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Restaurant location</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Update your coordinates to improve nearby discovery and dispatch accuracy.
          </p>
          <Link href="/restaurant/location" className="mt-4 inline-block">
            <Button variant="secondary">Open location manager</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
