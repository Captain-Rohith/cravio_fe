import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/types/api";

export interface MappedApiError {
  message: string;
  fieldErrors: Record<string, string>;
  statusCode?: number;
}

const defaultErrorMessage = "Unable to process your request. Please try again.";

export function mapApiError(error: unknown): MappedApiError {
  const axiosError = error as AxiosError<ErrorResponse>;
  const payload = axiosError.response?.data;
  const status = axiosError.response?.status;
  const fieldErrors: Record<string, string> = {};

  payload?.errors?.forEach((validationError) => {
    fieldErrors[validationError.field] = validationError.message;
  });

  let fallbackMessage = axiosError.message ?? defaultErrorMessage;
  if (status === 401) {
    fallbackMessage = "Your session expired. Please sign in again.";
  } else if (status === 403) {
    fallbackMessage = "Access denied for this action. Use a delivery-partner/admin account.";
  }

  return {
    message: payload?.message ?? fallbackMessage,
    fieldErrors,
    statusCode: status,
  };
}
