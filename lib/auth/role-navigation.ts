import type { UserRole } from "@/types/auth";
import { normalizeAuthRole } from "@/lib/auth/role-normalization";

export function getHomeRouteByRole(role: UserRole | string): string {
  const resolvedRole = normalizeAuthRole(role);

  if (resolvedRole === "ADMIN") {
    return "/admin";
  }

  if (resolvedRole === "DELIVERY_PARTNER") {
    return "/delivery/orders";
  }

  if (resolvedRole === "RESTAURANT") {
    return "/restaurant";
  }

  return "/restaurants";
}
