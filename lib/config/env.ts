const requiredEnv = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  NEXT_PUBLIC_TRACKING_WS_URL:
    process.env.NEXT_PUBLIC_TRACKING_WS_URL ?? "http://localhost:8081/ws-tracking",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Cravio",
};

export const env = {
  apiBaseUrl: requiredEnv.NEXT_PUBLIC_API_BASE_URL,
  trackingWsUrl: requiredEnv.NEXT_PUBLIC_TRACKING_WS_URL,
  appName: requiredEnv.NEXT_PUBLIC_APP_NAME,
} as const;
