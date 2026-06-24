import type { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, PaymentStatusResponse } from './IPaymentProvider';

export class OrangeMoneyProvider implements IPaymentProvider {
  readonly providerName = 'Orange Money';
  readonly isEnabled = false; // Activate in Phase 4

  async initiate(_request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    throw new Error('Orange Money payments are not yet activated. Online payments will be available in a future update.');
  }
  async checkStatus(_transactionId: string): Promise<PaymentStatusResponse> {
    throw new Error('Orange Money not activated');
  }
  async handleWebhook(_payload: any): Promise<{ success: boolean; transactionId: string }> {
    throw new Error('Orange Money not activated');
  }
}
