export interface PaymentInitiateRequest {
  studentId: number;
  invoiceId: number;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiateResponse {
  transactionId: string;
  paymentUrl?: string;
  ussdCode?: string;
  status: 'PENDING' | 'INITIATED' | 'FAILED';
  providerReference: string;
  message: string;
}

export interface PaymentStatusResponse {
  transactionId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  providerReference: string;
  amount?: number;
  paidAt?: string;
  message: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  readonly isEnabled: boolean;
  initiate(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse>;
  checkStatus(transactionId: string): Promise<PaymentStatusResponse>;
  handleWebhook(payload: any): Promise<{ success: boolean; transactionId: string }>;
}
