import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="page-enter mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-10">
          <h2 className="text-4xl font-semibold leading-tight">Operational visibility for every order.</h2>
          <p className="mt-4 max-w-lg text-sm text-[var(--color-text-muted)]">
            Sign in to continue with customer ordering, delivery execution, or administrative control.
          </p>
        </div>
        <div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
            Need an account? <Link href="/register" className="text-[var(--color-brand)]">Register</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
