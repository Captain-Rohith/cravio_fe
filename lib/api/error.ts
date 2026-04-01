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
  const fieldErrors: Record<string, string> = {};

  payload?.errors?.forEach((validationError) => {
    fieldErrors[validationError.field] = validationError.message;
  });

  return {
    message: payload?.message ?? axiosError.message ?? defaultErrorMessage,
    fieldErrors,
    statusCode: axiosError.response?.status,
  };
}
