import { request } from "@/lib/api/client";
import type {
  CreateMenuItemRequest,
  CreateRestaurantRequest,
  MenuItem,
  Restaurant,
  UpdateMenuItemRequest,
  UpdateRestaurantRequest,
} from "@/types/dto";

interface ApiEnvelope<T> {
  message?: string;
  data?: T;
}

interface PaginatedEnvelope<T> {
  message?: string;
  items?: T[];
  data?: T[];
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

function normalizeRestaurant(restaurant: Restaurant): Restaurant {
  return {
    ...restaurant,
    id: String(restaurant.id),
  };
}

function normalizeMenuItem(item: MenuItem): MenuItem {
  return {
    ...item,
    id: String(item.id),
    restaurantId: item.restaurantId ? String(item.restaurantId) : "",
  };
}

export function getNearbyRestaurants(latitude: number, longitude: number): Promise<Restaurant[]> {
  return request<Restaurant[] | ApiEnvelope<Restaurant[]> | PaginatedEnvelope<Restaurant>>({
    method: "GET",
    url: "/api/v1/restaurants/nearby",
    params: { latitude, longitude },
  }).then((payload) => {
    const unwrapped = unwrapPayload(payload);

    if (Array.isArray(unwrapped)) {
      return unwrapped.map(normalizeRestaurant);
    }

    if (unwrapped && typeof unwrapped === "object") {
      const obj = unwrapped as PaginatedEnvelope<Restaurant>;
      if (Array.isArray(obj.items)) {
        return obj.items.map(normalizeRestaurant);
      }
      if (Array.isArray(obj.data)) {
        return obj.data.map(normalizeRestaurant);
      }
    }

    return [];
  });
}

export function getRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
  return request<MenuItem[] | ApiEnvelope<MenuItem[]> | PaginatedEnvelope<MenuItem>>({
    method: "GET",
    url: `/api/v1/restaurants/${restaurantId}/menu`,
  }).then((payload) => {
    const unwrapped = unwrapPayload(payload);

    if (Array.isArray(unwrapped)) {
      return unwrapped.map(normalizeMenuItem);
    }

    if (unwrapped && typeof unwrapped === "object") {
      const obj = unwrapped as PaginatedEnvelope<MenuItem>;
      if (Array.isArray(obj.items)) {
        return obj.items.map(normalizeMenuItem);
      }
      if (Array.isArray(obj.data)) {
        return obj.data.map(normalizeMenuItem);
      }
    }

    return [];
  });
}

export function getRestaurantById(restaurantId: string): Promise<Restaurant> {
  return request<Restaurant | ApiEnvelope<Restaurant>>({
    method: "GET",
    url: `/api/v1/restaurants/${restaurantId}`,
  }).then((payload) => normalizeRestaurant(unwrapPayload(payload)));
}

export function createRestaurant(payload: CreateRestaurantRequest): Promise<Restaurant> {
  return request<Restaurant | ApiEnvelope<Restaurant>, CreateRestaurantRequest>({
    method: "POST",
    url: "/api/v1/restaurants",
    data: payload,
  }).then((response) => normalizeRestaurant(unwrapPayload(response)));
}

export function updateRestaurant(
  restaurantId: string,
  payload: UpdateRestaurantRequest,
): Promise<Restaurant> {
  return request<Restaurant | ApiEnvelope<Restaurant>, UpdateRestaurantRequest>({
    method: "PUT",
    url: `/api/v1/restaurants/${restaurantId}`,
    data: payload,
  }).then((response) => normalizeRestaurant(unwrapPayload(response)));
}

export function deleteRestaurant(restaurantId: string): Promise<void> {
  return request<void>({
    method: "DELETE",
    url: `/api/v1/restaurants/${restaurantId}`,
  });
}

export function createRestaurantMenuItem(
  restaurantId: string,
  payload: CreateMenuItemRequest,
): Promise<MenuItem> {
  return request<MenuItem | ApiEnvelope<MenuItem>, CreateMenuItemRequest>({
    method: "POST",
    url: `/api/v1/restaurants/${restaurantId}/menu`,
    data: payload,
  }).then((response) => normalizeMenuItem(unwrapPayload(response)));
}

export function getRestaurantMenuItem(
  restaurantId: string,
  menuItemId: string,
): Promise<MenuItem> {
  return request<MenuItem | ApiEnvelope<MenuItem>>({
    method: "GET",
    url: `/api/v1/restaurants/${restaurantId}/menu/${menuItemId}`,
  }).then((response) => normalizeMenuItem(unwrapPayload(response)));
}

export function updateRestaurantMenuItem(
  restaurantId: string,
  menuItemId: string,
  payload: UpdateMenuItemRequest,
): Promise<MenuItem> {
  return request<MenuItem | ApiEnvelope<MenuItem>, UpdateMenuItemRequest>({
    method: "PUT",
    url: `/api/v1/restaurants/${restaurantId}/menu/${menuItemId}`,
    data: payload,
  }).then((response) => normalizeMenuItem(unwrapPayload(response)));
}

export function deleteRestaurantMenuItem(restaurantId: string, menuItemId: string): Promise<void> {
  return request<void>({
    method: "DELETE",
    url: `/api/v1/restaurants/${restaurantId}/menu/${menuItemId}`,
  });
}
