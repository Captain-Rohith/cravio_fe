"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { useAuthStore } from "@/store/auth-store";

export function useAuthSession(requiredRoles?: UserRole[]): {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isHydrated: boolean;
} {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const hydrate = useAuthStore((state) => state.hydrate);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unauthorizedHandler = () => {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    };

    window.addEventListener("cravio:unauthorized", unauthorizedHandler);

    return () => {
      window.removeEventListener("cravio:unauthorized", unauthorizedHandler);
    };
  }, [clearSession, pathname, router]);

  const isAuthenticated = Boolean(session?.token);
  const isAuthorized =
    !requiredRoles || !session?.user.role ? false : requiredRoles.includes(session.user.role);

  return {
    isAuthenticated,
    isAuthorized: requiredRoles ? isAuthorized : isAuthenticated,
    isHydrated: session !== undefined,
  };
}
