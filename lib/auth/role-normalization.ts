import type { UserRole } from "@/types/auth";

export function normalizeAuthRole(role: unknown): UserRole {
  if (typeof role !== "string") {
    return "CUSTOMER";
  }

  const normalized = role.trim().toUpperCase().replaceAll(/[-\s]+/g, "_");

  if (normalized.includes("RESTAURANT")) {
    return "RESTAURANT";
  }

  if (normalized.includes("DELIVERY")) {
    return "DELIVERY_PARTNER";
  }

  if (normalized.includes("ADMIN")) {
    return "ADMIN";
  }

  return "CUSTOMER";
}