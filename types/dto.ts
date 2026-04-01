import type { UserRole } from "@/types/auth";

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  averagePreparationMinutes?: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface CreateRestaurantRequest {
  name: string;
  latitude: number;
  longitude: number;
}

export type UpdateRestaurantRequest = CreateRestaurantRequest;

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export type UpdateMenuItemRequest = CreateMenuItemRequest;

export type OrderStatus =
  | "CREATED"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface CreateOrderRequest {
  customerId: string;
  restaurantId: string;
  deliveryAddress: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export interface OrderDetails {
  orderId: string;
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantLatitude?: number;
  restaurantLongitude?: number;
  deliveryPartnerId?: string;
  deliveryAddress: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
  items: Array<{
    menuItemId: string;
    name?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: "CARD" | "UPI" | "CASH";
}

export interface PaymentDetails {
  id: string;
  orderId: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  transactionRef?: string;
  paidAt?: string;
}

export interface TrackingLocationRequest {
  orderId: string;
  deliveryPartnerId: string;
  latitude: number;
  longitude: number;
  h3Index?: string;
}

export interface TrackingEvent {
  orderId: string | number;
  deliveryPartnerId?: string | number;
  latitude: number;
  longitude: number;
  h3Index?: string;
  timestamp?: string;
}
