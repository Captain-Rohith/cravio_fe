import { request } from "@/lib/api/client";
import type { TrackingLocationRequest } from "@/types/dto";

export function sendLocationUpdate(payload: TrackingLocationRequest): Promise<void> {
  return request<void, TrackingLocationRequest>({
    method: "POST",
    url: "/api/v1/tracking/location",
    data: payload,
  });
}
