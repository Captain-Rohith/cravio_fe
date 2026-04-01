"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { getHomeRouteByRole } from "@/lib/auth/role-navigation";
import { useAuthStore } from "@/store/auth-store";
import { Spinner } from "@/components/ui/spinner";

interface RoleGateProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RoleGate({ roles, children }: RoleGateProps) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    console.info("[auth][role-gate] evaluate", {
      allowedRoles: roles,
      sessionRole: session?.user.role ?? null,
      hasSession: Boolean(session),
    });

    if (!session) {
      console.info("[auth][role-gate] redirect", { reason: "no-session", to: "/login" });
      router.replace("/login");
      return;
    }

    if (!roles.includes(session.user.role)) {
      const nextRoute = getHomeRouteByRole(session.user.role);
      console.info("[auth][role-gate] redirect", {
        reason: "role-not-allowed",
        sessionRole: session.user.role,
        to: nextRoute,
      });
      router.replace(nextRoute);
    }
  }, [roles, router, session]);

  if (!session || !roles.includes(session.user.role)) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}
