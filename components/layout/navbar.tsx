"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/config/env";
import { getHomeRouteByRole } from "@/lib/auth/role-navigation";
import { useAuthStore } from "@/store/auth-store";

const ThemeToggle = dynamic(
  () => import("@/components/layout/theme-toggle").then((mod) => mod.ThemeToggle),
  {
    ssr: false,
    loading: () => (
      <span className="inline-block h-9 w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
    ),
  },
);

export function Navbar() {
  const session = useAuthStore((state) => state.session);
  const hydrate = useAuthStore((state) => state.hydrate);
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    console.info("[auth][navbar] session", {
      role: session?.user.role ?? null,
      userId: session?.user.id ?? null,
    });
  }, [session?.user.id, session?.user.role]);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
          {env.appName}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <>
              {session.user.role === "CUSTOMER" ? (
                <Link href="/customer/orders">
                  <Button variant="outline">My Orders</Button>
                </Link>
              ) : null}
              <Link href={getHomeRouteByRole(session.user.role)}>
                <Button variant="secondary">
                  {session.user.role === "RESTAURANT" ? "Manage restaurant" : "Open workspace"}
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  clearSession();
                  router.push("/login");
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-[var(--color-brand)]">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
