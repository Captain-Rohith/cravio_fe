import { request } from "@/lib/api/client";
import type { PaymentDetails, PaymentRequest } from "@/types/dto";

export function processPayment(payload: PaymentRequest): Promise<PaymentDetails> {
  return request<PaymentDetails, PaymentRequest>({
    method: "POST",
    url: "/api/v1/payments/process",
    data: payload,
  });
}

export function getPaymentByOrderId(orderId: string): Promise<PaymentDetails> {
  return request<PaymentDetails>({
    method: "GET",
    url: `/api/v1/payments/orders/${orderId}`,
  });
}
