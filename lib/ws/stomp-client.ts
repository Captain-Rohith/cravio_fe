import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { env } from "@/lib/config/env";

function normalizeSockJsUrl(url: string): string {
  if (url.startsWith("wss://")) {
    return url.replace("wss://", "https://");
  }

  if (url.startsWith("ws://")) {
    return url.replace("ws://", "http://");
  }

  return url;
}

interface TrackingClientCallbacks {
  onError?: (message: string) => void;
  onClose?: () => void;
}

export function createTrackingClient(callbacks?: TrackingClientCallbacks): Client {
  return new Client({
    webSocketFactory: () => new SockJS(normalizeSockJsUrl(env.trackingWsUrl)),
    reconnectDelay: 2500,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onStompError: (frame) => {
      callbacks?.onError?.(frame.headers.message || "Tracking connection error");
    },
    onWebSocketError: () => {
      callbacks?.onError?.("WebSocket transport error");
    },
    onWebSocketClose: () => {
      callbacks?.onClose?.();
    },
  });
}
