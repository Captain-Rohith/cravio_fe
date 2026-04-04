"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrdersByCustomer } from "@/features/orders/api";
import { isCustomerTrackingAvailable } from "@/features/orders/tracking";
import { mapApiError } from "@/lib/api/error";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { OrderStatus } from "@/types/dto";

const activeStatuses = new Set<OrderStatus>([
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
]);

export default function Home() {
  const session = useAuthStore((state) => state.session);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const customerId = session?.user.role === "CUSTOMER" ? session.user.id : null;

  const activeOrdersQuery = useQuery({
    enabled: Boolean(customerId),
    queryKey: ["home-active-orders", customerId],
    queryFn: () => getOrdersByCustomer(customerId as string),
    select: (orders) => orders.filter((order) => activeStatuses.has(order.status)),
  });

  return (
    <AppShell>
      <div className="page-enter space-y-8">
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-8 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
            Smart delivery operating system
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight lg:text-6xl">
            Cravio powers reliable food delivery from checkout to doorstep tracking.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--color-text-muted)] lg:text-lg">
            Unified modules for customers, restaurant operators, delivery partners, and
            administrators. Designed for production demos and enterprise interview standards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/restaurants">
              <Button>Explore restaurants</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Create account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Open workspace</Button>
            </Link>
          </div>
        </section>

        {session?.user.role === "CUSTOMER" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">My active orders</h2>
              <Link href="/customer/orders">
                <Button variant="outline">View all orders</Button>
              </Link>
            </div>

            {activeOrdersQuery.isLoading ? <Skeleton className="h-36" /> : null}

            {activeOrdersQuery.isError ? (
              <ErrorState description={mapApiError(activeOrdersQuery.error).message} />
            ) : null}

            {activeOrdersQuery.isSuccess && activeOrdersQuery.data.length === 0 ? (
              <Card>
                <p className="text-sm text-[var(--color-text-muted)]">
                  No active orders right now. Explore restaurants to place a new order.
                </p>
              </Card>
            ) : null}

            {activeOrdersQuery.isSuccess && activeOrdersQuery.data.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeOrdersQuery.data.map((order) => (
                  <Card key={order.orderId} className="space-y-2">
                    <p className="text-sm text-[var(--color-text-muted)]">Order #{order.orderId}</p>
                    <StatusBadge value={order.status} type="order" />
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Placed: {formatDateTime(order.createdAt)}
                    </p>
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <div className="flex gap-2">
                      <Link href={`/customer/orders/${order.orderId}`}>
                        <Button variant="outline">Details</Button>
                      </Link>
                      {isCustomerTrackingAvailable(order) ? (
                        <Link href={`/customer/orders/${order.orderId}/tracking`}>
                          <Button>Track</Button>
                        </Link>
                      ) : (
                        <Button disabled>Tracking pending</Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <h2 className="text-lg font-semibold">Customer workflow</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Restaurant discovery, cart, checkout, payment, order history, and live tracking.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Restaurant operations</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Manage menu pricing, update order statuses, and keep your location metadata accurate.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Delivery operations</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Assigned order updates with status transitions and geo-location publishing.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Administrative control</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Internal team workflow for restaurant onboarding, menu management, partner assignment,
              and payment visibility.
            </p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
