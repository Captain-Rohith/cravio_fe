import { request } from "@/lib/api/client";
import type {
  CustomerTrackingLocationRequest,
  TrackingEvent,
  TrackingLocationRequest,
} from "@/types/dto";

interface ApiEnvelope<T> {
  message?: string;
  data?: T;
}

function normalizeTrackingEvent(event: TrackingEvent | null | undefined): TrackingEvent | null {
  if (!event) {
    return null;
  }

  return {
    ...event,
    orderId: String(event.orderId),
    deliveryPartnerId: event.deliveryPartnerId ? String(event.deliveryPartnerId) : undefined,
    customerId: event.customerId ? String(event.customerId) : undefined,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
}

export function sendLocationUpdate(payload: TrackingLocationRequest): Promise<void> {
  return request<void, TrackingLocationRequest>({
    method: "POST",
    url: "/api/v1/tracking/location",
    data: payload,
  });
}

export function getLatestTrackingEvent(orderId: string): Promise<TrackingEvent | null> {
  return request<ApiEnvelope<TrackingEvent | null> | TrackingEvent | null>({
    method: "GET",
    url: `/api/v1/tracking/orders/${orderId}/latest`,
  }).then((response) => {
    if (response && typeof response === "object" && "data" in (response as Record<string, unknown>)) {
      const envelope = response as ApiEnvelope<TrackingEvent | null>;
      return normalizeTrackingEvent(envelope.data ?? null);
    }

    return normalizeTrackingEvent(response as TrackingEvent | null);
  });
}

export function sendCustomerLocationUpdate(payload: CustomerTrackingLocationRequest): Promise<void> {
  return request<void, CustomerTrackingLocationRequest>({
    method: "POST",
    url: "/api/v1/tracking/customer-location",
    data: payload,
  });
}

export function getLatestCustomerTrackingEvent(orderId: string): Promise<TrackingEvent | null> {
  return request<ApiEnvelope<TrackingEvent | null> | TrackingEvent | null>({
    method: "GET",
    url: `/api/v1/tracking/orders/${orderId}/customer/latest`,
  }).then((response) => {
    if (response && typeof response === "object" && "data" in (response as Record<string, unknown>)) {
      const envelope = response as ApiEnvelope<TrackingEvent | null>;
      return normalizeTrackingEvent(envelope.data ?? null);
    }

    return normalizeTrackingEvent(response as TrackingEvent | null);
  });
}
