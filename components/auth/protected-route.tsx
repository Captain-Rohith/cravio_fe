"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionSnapshot } from "@/lib/auth/token-storage";
import { useAuthStore } from "@/store/auth-store";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const hydrate = useAuthStore((state) => state.hydrate);
  const router = useRouter();
  const hasPersistedSession = Boolean(getSessionSnapshot());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!session && !hasPersistedSession) {
      router.replace("/login");
    }
  }, [hasPersistedSession, router, session]);

  if (!session) {
    return (
      <div className="grid min-h-[50vh] place-items-center" aria-live="polite">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}
