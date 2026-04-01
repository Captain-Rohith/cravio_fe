import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="page-enter mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-10">
          <h2 className="text-4xl font-semibold leading-tight">Onboard quickly for every operation role.</h2>
          <p className="mt-4 max-w-lg text-sm text-[var(--color-text-muted)]">
            Create an account for customer purchases, delivery execution, or restaurant operations.
          </p>
        </div>
        <div>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
            Already have an account? <Link href="/login" className="text-[var(--color-brand)]">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
