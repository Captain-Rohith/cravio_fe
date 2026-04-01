"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const hydrate = useAuthStore((state) => state.hydrate);
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [router, session]);

  if (!session) {
    return (
      <div className="grid min-h-[50vh] place-items-center" aria-live="polite">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}
