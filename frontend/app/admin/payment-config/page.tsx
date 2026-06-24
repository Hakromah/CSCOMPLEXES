'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, ShieldAlert, CheckCircle, Info, Landmark, HelpCircle,
  ToggleLeft, ToggleRight, Settings, Smartphone, Key, Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PaymentConfig() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated configuration state for display
  const [configValues, setConfigValues] = useState<Record<string, any>>({
    ORANGE_MONEY: { merchantId: 'OM-908234-X', apiKey: '••••••••••••••••••••', isSimulatedEnabled: false },
    MTN_MOBILE_MONEY: { apiUser: 'MTN-USER-2311', apiKey: '••••••••••••••••••••', isSimulatedEnabled: false },
    BANK_TRANSFER: { bankName: 'Société Générale de Banques en Guinée', accountNumber: '20192348-12', isSimulatedEnabled: false },
    CARD: { publicKey: 'pk_live_51P...', secretKey: '••••••••••••••••••••', isSimulatedEnabled: false },
  });

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-finance/payment-providers');
      setProviders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch providers', err);
      // Fallback fallback simulated providers if endpoint fails
      setProviders([
        { type: 'ORANGE_MONEY', name: 'Orange Money', isEnabled: false },
        { type: 'MTN_MOBILE_MONEY', name: 'MTN Mobile Money', isEnabled: false },
        { type: 'BANK_TRANSFER', name: 'Bank Transfer', isEnabled: false },
        { type: 'CARD', name: 'Card Payment', isEnabled: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSaveSimulatedConfig = (providerType: string) => {
    toast.info(`${providerType.replace('_', ' ')} settings saved locally. Gateway integrations are configured as inactive skeleton provider interfaces this phase.`);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <CreditCard size={32} className="text-primary" />
            Online Payment Provider Gateways
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Configure mobile money API keys, bank transfer references, and card processing credentials
          </p>
        </div>
      </header>

      {/* Gateway Alert */}
      <div className="bg-blue-50/50 border border-blue-200/60 p-5 rounded-3xl flex items-start gap-4">
        <Info className="text-primary mt-1 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-slate-900">Phase 3 Payment Infrastructure Status</h4>
          <p className="text-slate-650 text-xs mt-1 leading-relaxed">
            The online payment gateway architecture has been implemented as **provider interface skeletons**. All live card and mobile money processing is **initially deactivated (`isEnabled: false`)** to ensure accounting ledger compliance during initial setup. Gateways can be activated in Phase 4 via settings files or environment parameters without code refactoring.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {providers.map((provider) => {
          const type = provider.type;
          const conf = configValues[type] || {};

          return (
            <Card key={type} className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-slate-50 p-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                      {type === 'BANK_TRANSFER' ? <Landmark size={20} className="text-primary" /> : <Smartphone size={20} className="text-primary" />}
                      {provider.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      {type === 'CARD' ? 'Visa / Mastercard Processing' : 'Mobile Payments Gateway'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-slate-100 bg-slate-50">
                    SKELETON INACTIVE
                  </Badge>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {type === 'ORANGE_MONEY' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Merchant ID</label>
                        <Input
                          placeholder="e.g. OM-908234-X"
                          value={conf.merchantId}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            ORANGE_MONEY: { ...conf, merchantId: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">API Authentication Key</label>
                        <Input
                          type="password"
                          placeholder="API Key"
                          value={conf.apiKey}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            ORANGE_MONEY: { ...conf, apiKey: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}

                  {type === 'MTN_MOBILE_MONEY' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">API User ID</label>
                        <Input
                          placeholder="e.g. MTN-USER-2311"
                          value={conf.apiUser}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            MTN_MOBILE_MONEY: { ...conf, apiUser: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subscription Key</label>
                        <Input
                          type="password"
                          placeholder="Subscription Key"
                          value={conf.apiKey}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            MTN_MOBILE_MONEY: { ...conf, apiKey: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}

                  {type === 'BANK_TRANSFER' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Receiving Institution Name</label>
                        <Input
                          placeholder="Bank Name"
                          value={conf.bankName}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            BANK_TRANSFER: { ...conf, bankName: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">IBAN / Account Number</label>
                        <Input
                          placeholder="Account Number"
                          value={conf.accountNumber}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            BANK_TRANSFER: { ...conf, accountNumber: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}

                  {type === 'CARD' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Publishable API Key</label>
                        <Input
                          placeholder="pk_live_..."
                          value={conf.publicKey}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            CARD: { ...conf, publicKey: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Secret API Key</label>
                        <Input
                          type="password"
                          placeholder="sk_live_..."
                          value={conf.secretKey}
                          onChange={(e) => setConfigValues({
                            ...configValues,
                            CARD: { ...conf, secretKey: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Gateway Active Status
                    </span>
                    <Badge className="bg-slate-100 text-slate-500 font-bold border border-slate-200">
                      DISABLED IN SKELETON
                    </Badge>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 flex justify-end">
                <Button onClick={() => handleSaveSimulatedConfig(type)} className="bg-slate-900 text-white rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-wider">
                  Save Gateway
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
