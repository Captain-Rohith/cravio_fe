export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  errors?: ValidationError[];
}

export interface ApiListResponse<T> {
  items: T[];
  total?: number;
}

export type RequestStatus = "idle" | "loading" | "success" | "error";
