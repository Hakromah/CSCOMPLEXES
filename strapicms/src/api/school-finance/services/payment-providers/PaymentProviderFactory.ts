import type { IPaymentProvider } from './IPaymentProvider';
import { OrangeMoneyProvider } from './OrangeMoneyProvider';
import { MTNMobileMoneyProvider } from './MTNMobileMoneyProvider';
import { BankTransferProvider } from './BankTransferProvider';
import { CardPaymentProvider } from './CardPaymentProvider';

export type PaymentProviderType = 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD';

const providers: Record<PaymentProviderType, IPaymentProvider> = {
  ORANGE_MONEY: new OrangeMoneyProvider(),
  MTN_MOBILE_MONEY: new MTNMobileMoneyProvider(),
  BANK_TRANSFER: new BankTransferProvider(),
  CARD: new CardPaymentProvider(),
};

export function getProvider(type: PaymentProviderType): IPaymentProvider {
  const provider = providers[type];
  if (!provider) throw new Error(`Unknown payment provider: ${type}`);
  if (!provider.isEnabled) {
    throw new Error(`${provider.providerName} is not yet activated. Online payments will be available in a future update.`);
  }
  return provider;
}

export function getAllProviders(): Array<{ type: PaymentProviderType; name: string; isEnabled: boolean }> {
  return Object.entries(providers).map(([type, provider]) => ({
    type: type as PaymentProviderType,
    name: provider.providerName,
    isEnabled: provider.isEnabled,
  }));
}

export function isAnyProviderEnabled(): boolean {
  return Object.values(providers).some(p => p.isEnabled);
}
