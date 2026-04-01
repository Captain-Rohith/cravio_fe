import type { UserRole } from "@/types/auth";
import { normalizeAuthRole } from "@/lib/auth/role-normalization";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const normalizedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(normalizedBase64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function findRoleInJwtPayload(payload: Record<string, unknown>): string | null {
  const directCandidates = [payload.role, payload.userRole, payload.authority, payload.scope];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  const listCandidates = [payload.roles, payload.authorities, payload.permissions];
  for (const candidate of listCandidates) {
    if (Array.isArray(candidate)) {
      const firstRole = candidate.find((entry) => typeof entry === "string" && entry.trim().length > 0);
      if (typeof firstRole === "string") {
        return firstRole;
      }
    }
  }

  return null;
}

export function resolveAuthRole(inputRole: unknown, token?: string): UserRole {
  const normalizedInput = normalizeAuthRole(inputRole);
  if (!token) {
    return normalizedInput;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return normalizedInput;
  }

  const jwtRole = findRoleInJwtPayload(payload);
  if (!jwtRole) {
    return normalizedInput;
  }

  return normalizeAuthRole(jwtRole);
}