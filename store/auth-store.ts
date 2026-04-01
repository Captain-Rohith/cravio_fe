import { create } from "zustand";
import type { AuthSession } from "@/types/auth";
import {
  clearSessionSnapshot,
  clearToken,
  getSessionSnapshot,
  setSessionSnapshot,
  setToken,
} from "@/lib/auth/token-storage";
import { resolveAuthRole } from "@/lib/auth/role-resolution";

interface AuthStore {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  setSession: (session) => {
    const normalizedSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        role: resolveAuthRole(session.user.role, session.token),
      },
    };

    console.info("[auth][store] setSession", {
      inputRole: session.user.role,
      normalizedRole: normalizedSession.user.role,
      userId: normalizedSession.user.id,
    });

    setToken(normalizedSession.token);
    setSessionSnapshot(JSON.stringify(normalizedSession));
    set({ session: normalizedSession });
  },
  clearSession: () => {
    clearToken();
    clearSessionSnapshot();
    set({ session: null });
  },
  hydrate: () => {
    const snapshot = getSessionSnapshot();
    if (!snapshot) {
      return;
    }

    try {
      const parsed = JSON.parse(snapshot) as AuthSession;
      const normalizedSession: AuthSession = {
        ...parsed,
        user: {
          ...parsed.user,
          role: resolveAuthRole(parsed.user.role, parsed.token),
        },
      };

      console.info("[auth][store] hydrate", {
        inputRole: parsed.user.role,
        normalizedRole: normalizedSession.user.role,
        userId: normalizedSession.user.id,
      });

      setToken(normalizedSession.token);
      set({ session: normalizedSession });
    } catch {
      clearToken();
      clearSessionSnapshot();
      set({ session: null });
    }
  },
}));
