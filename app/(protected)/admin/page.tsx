import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Admin dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Restaurant onboarding</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Create and manage restaurants.</p>
          <Link href="/admin/restaurants" className="mt-3 inline-block text-sm text-[var(--color-brand)]">
            Open module
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Menu management</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Add menu items to onboarded restaurants.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Order operations</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Assign partners, update statuses, and inspect payment details.
          </p>
          <Link href="/admin/orders" className="mt-3 inline-block text-sm text-[var(--color-brand)]">
            Open module
          </Link>
        </Card>
      </div>
    </div>
  );
}
