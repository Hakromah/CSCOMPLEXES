import type { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, PaymentStatusResponse } from './IPaymentProvider';

export class CardPaymentProvider implements IPaymentProvider {
  readonly providerName = 'Card Payment';
  readonly isEnabled = false; // Activate in Phase 4

  async initiate(_request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    throw new Error('Card Payments are not yet activated. Online payments will be available in a future update.');
  }
  async checkStatus(_transactionId: string): Promise<PaymentStatusResponse> {
    throw new Error('Card Payment not activated');
  }
  async handleWebhook(_payload: any): Promise<{ success: boolean; transactionId: string }> {
    throw new Error('Card Payment not activated');
  }
}
