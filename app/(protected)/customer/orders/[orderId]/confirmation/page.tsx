"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();

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
        <Link href={`/customer/orders/${params.orderId}/tracking`}>
          <Button>Open tracking</Button>
        </Link>
      </div>
    </Card>
  );
}
