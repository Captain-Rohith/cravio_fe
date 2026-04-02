import { request } from "@/lib/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/dto";

interface ApiEnvelope<TData> {
  message?: string;
  data?: TData;
}

interface LoginData {
  token?: string;
  user?: {
    id?: string | number;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

interface RegisteredUserData {
  id?: string | number;
  fullName?: string;
  email?: string;
  role?: string;
}

function normalizeAuthResponse(payload: AuthResponse | ApiEnvelope<LoginData>): AuthResponse {
  if ("token" in payload && typeof payload.token === "string") {
    return payload;
  }

  if (!("data" in payload)) {
    throw new Error("Invalid auth response payload");
  }

  const token = payload.data?.token;
  const user = payload.data?.user;

  if (!token || !user?.id || !user.email || !user.fullName || !user.role) {
    throw new Error("Invalid auth response payload");
  }

  return {
    token,
    userId: String(user.id),
    fullName: user.fullName,
    email: user.email,
    role: user.role as AuthResponse["role"],
  };
}

export function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  return request<ApiEnvelope<RegisteredUserData>, RegisterRequest>({
    url: "/api/v1/auth/register",
    method: "POST",
    data: payload,
  }).then(() => loginUser({ email: payload.email, password: payload.password }));
}

export function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse | ApiEnvelope<LoginData>, LoginRequest>({
    url: "/api/v1/auth/login",
    method: "POST",
    data: payload,
  }).then(normalizeAuthResponse);
}
