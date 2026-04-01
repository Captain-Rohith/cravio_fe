export type UserRole = "CUSTOMER" | "DELIVERY_PARTNER" | "RESTAURANT" | "ADMIN";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
