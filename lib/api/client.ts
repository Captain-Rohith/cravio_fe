import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/config/env";
import { clearSessionSnapshot, clearToken, getToken } from "@/lib/auth/token-storage";
import { useAuthStore } from "@/store/auth-store";

export function appendAuthToken(
  config: InternalAxiosRequestConfig,
  token: string | null,
): InternalAxiosRequestConfig {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const tokenFromStorage = getToken();
  const tokenFromSession = useAuthStore.getState().session?.token ?? null;
  return appendAuthToken(config, tokenFromStorage ?? tokenFromSession);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      clearSessionSnapshot();
      useAuthStore.getState().clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cravio:unauthorized"));
      }
    }

    return Promise.reject(error);
  },
);

export function request<TResponse, TBody = unknown>(
  config: AxiosRequestConfig<TBody>,
): Promise<TResponse> {
  return apiClient
    .request<TResponse, AxiosResponse<TResponse>, TBody>(config)
    .then((response) => response.data);
}
