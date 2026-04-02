import { request } from "@/lib/api/client";
import type {
  CreateOrderRequest,
  NearbyAvailableOrder,
  OrderDetails,
  OrderStatus,
} from "@/types/dto";

interface ApiEnvelope<T> {
  message?: string;
  data?: T;
}

interface ListEnvelope<T> {
  message?: string;
  data?: T[];
  items?: T[];
}

function unwrapPayload<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const data = (payload as ApiEnvelope<T>).data;
    if (data !== undefined) {
      return data;
    }
  }

  return payload as T;
}

function toValidId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") {
      return "";
    }
    return trimmed;
  }

  return "";
}

function normalizeOrder(order: OrderDetails): OrderDetails {
  const source = order as OrderDetails & { orderId?: string | number; id?: string | number };
  const canonicalOrderId = toValidId(source.orderId) || toValidId(source.id);

  return {
    ...source,
    orderId: canonicalOrderId,
    id: canonicalOrderId,
    customerId: String(order.customerId),
    restaurantId: String(order.restaurantId),
    deliveryPartnerId: order.deliveryPartnerId ? String(order.deliveryPartnerId) : undefined,
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          menuItemId: String(item.menuItemId),
        }))
      : [],
  };
}

function normalizeOrderList(payload: OrderDetails[] | ApiEnvelope<OrderDetails[]> | ListEnvelope<OrderDetails>): OrderDetails[] {
  const unwrapped = unwrapPayload(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped.map(normalizeOrder);
  }

  if (unwrapped && typeof unwrapped === "object") {
    const obj = unwrapped as ListEnvelope<OrderDetails>;
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeOrder);
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeOrder);
    }
  }

  return [];
}

function normalizeNearbyOrder(order: NearbyAvailableOrder): NearbyAvailableOrder {
  return {
    ...order,
    orderId: String(order.orderId),
    customerId: String(order.customerId),
    restaurantId: String(order.restaurantId),
    deliveryPartnerId: order.deliveryPartnerId ? String(order.deliveryPartnerId) : undefined,
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          menuItemId: String(item.menuItemId),
        }))
      : [],
  };
}

function normalizeNearbyOrderList(
  payload:
    | NearbyAvailableOrder[]
    | ApiEnvelope<NearbyAvailableOrder[]>
    | ListEnvelope<NearbyAvailableOrder>,
): NearbyAvailableOrder[] {
  const unwrapped = unwrapPayload(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped.map(normalizeNearbyOrder);
  }

  if (unwrapped && typeof unwrapped === "object") {
    const obj = unwrapped as ListEnvelope<NearbyAvailableOrder>;
    if (Array.isArray(obj.items)) {
      return obj.items.map(normalizeNearbyOrder);
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeNearbyOrder);
    }
  }

  return [];
}

export function createOrder(payload: CreateOrderRequest): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>, CreateOrderRequest>({
    method: "POST",
    url: "/api/v1/orders",
    data: payload,
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}

export function getOrderById(orderId: string): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>>({
    method: "GET",
    url: `/api/v1/orders/${orderId}`,
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}

export function getOrdersByCustomer(customerId: string): Promise<OrderDetails[]> {
  return request<OrderDetails[] | ApiEnvelope<OrderDetails[]> | ListEnvelope<OrderDetails>>({
    method: "GET",
    url: `/api/v1/orders/customers/${customerId}`,
  }).then(normalizeOrderList);
}

export function cancelOrderByCustomer(customerId: string, orderId: string): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>>({
    method: "PATCH",
    url: `/api/v1/orders/customers/${customerId}/${orderId}/cancel`,
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}

export function getOrdersByRestaurant(restaurantId: string): Promise<OrderDetails[]> {
  return request<OrderDetails[] | ApiEnvelope<OrderDetails[]> | ListEnvelope<OrderDetails>>({
    method: "GET",
    url: `/api/v1/orders/restaurants/${restaurantId}`,
  }).then(normalizeOrderList);
}

export function getNearbyAvailableOrders(
  latitude: number,
  longitude: number,
): Promise<NearbyAvailableOrder[]> {
  return request<
    NearbyAvailableOrder[] | ApiEnvelope<NearbyAvailableOrder[]> | ListEnvelope<NearbyAvailableOrder>
  >({
    method: "GET",
    url: "/api/v1/orders/available/nearby",
    params: { latitude, longitude },
  }).then(normalizeNearbyOrderList);
}

export function claimNearbyOrder(
  orderId: string,
  latitude: number,
  longitude: number,
): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>>({
    method: "PATCH",
    url: `/api/v1/orders/${orderId}/claim`,
    params: { latitude, longitude },
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>>({
    method: "PATCH",
    url: `/api/v1/orders/${orderId}/status`,
    params: { status },
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}

export function updateRestaurantOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>>({
    method: "PATCH",
    url: `/api/v1/orders/restaurants/${restaurantId}/${orderId}/status`,
    params: { status },
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}

export function assignDeliveryPartner(
  orderId: string,
  deliveryPartnerId: string,
): Promise<OrderDetails> {
  return request<OrderDetails | ApiEnvelope<OrderDetails>>({
    method: "PATCH",
    url: `/api/v1/orders/${orderId}/assign/${deliveryPartnerId}`,
  }).then((response) => normalizeOrder(unwrapPayload(response)));
}
