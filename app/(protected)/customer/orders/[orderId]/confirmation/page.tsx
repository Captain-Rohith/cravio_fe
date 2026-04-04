"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/features/orders/api";
import { isCustomerTrackingAvailable } from "@/features/orders/tracking";
import { mapApiError } from "@/lib/api/error";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const orderQuery = useQuery({
    queryKey: ["order-confirmation", params.orderId],
    queryFn: () => getOrderById(params.orderId),
    refetchInterval: 10000,
  });

  return (
    <Card className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Order confirmed</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        Your order was placed successfully. Track status updates in real time.
      </p>
      <p className="text-sm">Reference: {params.orderId}</p>
      <div className="flex gap-3">
        <Link href={`/customer/orders/${params.orderId}`}>
          <Button variant="outline">View details</Button>
        </Link>
        {isCustomerTrackingAvailable(orderQuery.data) ? (
          <Link href={`/customer/orders/${params.orderId}/tracking`}>
            <Button>Open tracking</Button>
          </Link>
        ) : (
          <Button disabled>{orderQuery.isLoading ? "Checking tracking..." : "Tracking pending"}</Button>
        )}
      </div>
      {orderQuery.isError ? (
        <p className="text-sm text-[var(--color-danger)]">{mapApiError(orderQuery.error).message}</p>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          Tracking unlocks once a delivery partner accepts this order.
        </p>
      )}
    </Card>
  );
}
