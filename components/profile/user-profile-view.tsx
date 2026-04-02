"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRestaurantId } from "@/hooks/use-restaurant-id";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/auth";

interface UserProfileViewProps {
  role: UserRole;
  title: string;
  description: string;
}

function roleDisplay(role: UserRole): string {
  if (role === "DELIVERY_PARTNER") {
    return "Delivery Partner";
  }

  const normalized = role.toLowerCase().replaceAll("_", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function UserProfileView({ role, title, description }: UserProfileViewProps) {
  const session = useAuthStore((state) => state.session);
  const { restaurantId } = useRestaurantId();

  if (!session) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
        </header>
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Session not found</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sign in again to load your profile details.
          </p>
          <Link href="/login" className="inline-block">
            <Button>Open login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const linkedRestaurantId = restaurantId.trim();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Profile summary</h2>
        <div className="grid gap-2 text-sm text-[var(--color-text-muted)] md:grid-cols-2">
          <p>
            Full name: <span className="text-[var(--color-text)]">{session.user.fullName}</span>
          </p>
          <p>
            Email: <span className="text-[var(--color-text)]">{session.user.email}</span>
          </p>
          <p>
            User ID: <span className="text-[var(--color-text)]">{session.user.id}</span>
          </p>
          <p>
            Role: <span className="text-[var(--color-text)]">{roleDisplay(session.user.role)}</span>
          </p>
        </div>
      </Card>

      {role === "RESTAURANT" ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Restaurant profile link</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Linked restaurant profile ID:{" "}
            <span className="text-[var(--color-text)]">{linkedRestaurantId || "Not linked"}</span>
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Link or create your restaurant profile from the location settings page.
          </p>
          <Link href="/restaurant/location" className="inline-block">
            <Button variant="secondary">Open location settings</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
