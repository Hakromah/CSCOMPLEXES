import type { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, PaymentStatusResponse } from './IPaymentProvider';

export class BankTransferProvider implements IPaymentProvider {
  readonly providerName = 'Bank Transfer';
  readonly isEnabled = false; // Activate in Phase 4

  async initiate(_request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    throw new Error('Bank Transfer online payments are not yet activated. Online payments will be available in a future update.');
  }
  async checkStatus(_transactionId: string): Promise<PaymentStatusResponse> {
    throw new Error('Bank Transfer not activated');
  }
  async handleWebhook(_payload: any): Promise<{ success: boolean; transactionId: string }> {
    throw new Error('Bank Transfer not activated');
  }
}
