"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type IMessage } from "@stomp/stompjs";
import { createTrackingClient } from "@/lib/ws/stomp-client";
import type { MapMarker } from "@/features/maps/types";
import type { TrackingEvent } from "@/types/dto";

function animateMovement(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  onFrame: (point: { lat: number; lng: number }) => void,
): number {
  const start = performance.now();
  const duration = 600;

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const smooth = progress * (2 - progress);
    onFrame({
      lat: from.lat + (to.lat - from.lat) * smooth,
      lng: from.lng + (to.lng - from.lng) * smooth,
    });

    if (progress < 1) {
      return requestAnimationFrame(tick);
    }

    return 0;
  };

  return requestAnimationFrame(tick);
}

export function useOrderTracking(orderId: string | null) {
  const [latestEvent, setLatestEvent] = useState<TrackingEvent | null>(null);
  const [connectionState, setConnectionState] = useState<"connected" | "reconnecting" | "offline">("offline");
  const [deliveryMarker, setDeliveryMarker] = useState<MapMarker | null>(null);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not available");
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number | null>(null);

  const topic = useMemo(() => (orderId ? `/topic/orders/${orderId}` : null), [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastUpdateRef.current) {
        return;
      }

      const deltaSeconds = Math.max(0, Math.floor((Date.now() - lastUpdateRef.current) / 1000));
      setLastUpdatedLabel(`${deltaSeconds}s ago`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!topic || !orderId) {
      return;
    }

    const client = createTrackingClient({
      onError: () => setConnectionState("reconnecting"),
      onClose: () => setConnectionState("reconnecting"),
    });

    client.onConnect = () => {
      setConnectionState("connected");

      client.subscribe(topic, (message: IMessage) => {
        const parsed = JSON.parse(message.body) as TrackingEvent;
        const next = {
          lat: parsed.latitude,
          lng: parsed.longitude,
        };

        lastUpdateRef.current = Date.now();
        setLastUpdatedLabel("0s ago");
        setLatestEvent({ ...parsed, timestamp: parsed.timestamp ?? new Date().toISOString() });

        setDeliveryMarker((current) => {
          const previous = current ?? {
            id: String(parsed.deliveryPartnerId ?? `order-${orderId}`),
            type: "delivery-partner" as const,
            lat: next.lat,
            lng: next.lng,
            label: "Delivery partner",
            status: "Live",
            updatedAt: new Date().toISOString(),
          };

          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }

          animationRef.current = animateMovement(
            { lat: previous.lat, lng: previous.lng },
            next,
            (point) => {
              setDeliveryMarker((active) =>
                active
                  ? {
                      ...active,
                      lat: point.lat,
                      lng: point.lng,
                      updatedAt: new Date().toISOString(),
                    }
                  : active,
              );
            },
          );

          return {
            ...previous,
            status: "Live",
            updatedAt: new Date().toISOString(),
          };
        });
      });
    };

    client.activate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      client.deactivate();
      setConnectionState("offline");
    };
  }, [orderId, topic]);

  return {
    latestEvent,
    connectionState,
    deliveryMarker,
    lastUpdatedLabel,
  };
}
