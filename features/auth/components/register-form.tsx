"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { registerUser } from "@/features/auth/api";
import { mapApiError } from "@/lib/api/error";
import { getHomeRouteByRole } from "@/lib/auth/role-navigation";
import { resolveAuthRole } from "@/lib/auth/role-resolution";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["CUSTOMER", "DELIVERY_PARTNER", "RESTAURANT"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "CUSTOMER",
    },
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (response) => {
      const role = resolveAuthRole(response.role, response.token);
      console.info("[auth][register] role mapping", {
        rawRole: response.role,
        normalizedRole: role,
      });

      setSession({
        token: response.token,
        user: {
          id: response.userId,
          fullName: response.fullName,
          email: response.email,
          role,
        },
      });
      toast.success("Account created successfully");
      router.push(getHomeRouteByRole(role));
    },
    onError: (error) => {
      const mapped = mapApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof RegisterFormValues, { message });
      });
      toast.error(mapped.message);
    },
  });

  return (
    <Card className="mx-auto w-full max-w-lg">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Create account</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Register as customer, delivery partner, or restaurant owner.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Full name</label>
          <Input {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Email</label>
          <Input type="email" {...form.register("email")} error={form.formState.errors.email?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Password</label>
          <Input
            type="password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Role</label>
          <select
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            {...form.register("role")}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="DELIVERY_PARTNER">Delivery partner</option>
            <option value="RESTAURANT">Restaurant</option>
          </select>
        </div>
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Register
        </Button>
      </form>
    </Card>
  );
}
