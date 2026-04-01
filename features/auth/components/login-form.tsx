"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/features/auth/api";
import { mapApiError } from "@/lib/api/error";
import { getHomeRouteByRole } from "@/lib/auth/role-navigation";
import { resolveAuthRole } from "@/lib/auth/role-resolution";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      const role = resolveAuthRole(response.role, response.token);
      console.info("[auth][login] role mapping", {
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
      toast.success("Login successful");
      const nextRoute = search.get("next") || getHomeRouteByRole(role);
      router.push(nextRoute);
    },
    onError: (error) => {
      const mapped = mapApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof LoginFormValues, { message });
      });
      toast.error(mapped.message);
    },
  });

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Sign in</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Access your Cravio workspace securely.
      </p>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
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

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Continue
        </Button>
      </form>
    </Card>
  );
}
