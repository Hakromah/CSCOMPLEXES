'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Info, Landmark, Smartphone, Building,
  Phone, Save, Loader2, CheckCircle2, ShieldCheck, AlertCircle,
  ToggleLeft, ToggleRight, Clock, Mail, MapPin, FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PaymentMethodsData {
  id?: number;
  bankName: string;
  accountHolder: string;
  rib: string;
  branchCode: string;
  swift: string;
  bankInstructions: string;
  isBankTransferActive: boolean;
  orangeMoneyMerchant: string;
  orangeMoneyInstructions: string;
  isOrangeMoneyActive: boolean;
  mtnMoMoCode: string;
  mtnMoMoInstructions: string;
  isMtnMoMoActive: boolean;
  cashierLocation: string;
  cashierHours: string;
  isCashierActive: boolean;
  contactEmail: string;
  contactPhone: string;
  additionalNotes: string;
}

const DEFAULT_SETTINGS: PaymentMethodsData = {
  bankName: 'Banque Centrale / Vista Bank Guinée',
  accountHolder: '2CS COMPLEXE SCOLAIRE',
  rib: 'GN04 0001 2345 6789 0123 45',
  branchCode: '01001',
  swift: 'VISTGNCON',
  bankInstructions: 'Mentionnez impérativement le N° de Facture et votre ID Élève en référence de votre virement pour un rapprochement comptable immédiat.',
  isBankTransferActive: true,
  orangeMoneyMerchant: '#144*2*1*XXXXX#',
  orangeMoneyInstructions: 'Composez le code USSD ci-dessus pour effectuer le paiement direct sécurisé.',
  isOrangeMoneyActive: true,
  mtnMoMoCode: '*440*XXXXXX#',
  mtnMoMoInstructions: 'Paiement marchand via le code court MTN Mobile Money.',
  isMtnMoMoActive: true,
  cashierLocation: 'Bâtiment Administratif, RDC',
  cashierHours: 'Lundi au Vendredi: 08h00 — 16h00',
  isCashierActive: true,
  contactEmail: 'accounts@2cscomplexes.com',
  contactPhone: '+224 620 00 00 00',
  additionalNotes: 'Conservez précieusement vos reçus de versement pour tout contrôle administratif.'
};

export default function PaymentConfig() {
  const [settings, setSettings] = useState<PaymentMethodsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('bank');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-finance/payment-methods');
      if (res.data && Object.keys(res.data).length > 0) {
        setSettings({ ...DEFAULT_SETTINGS, ...res.data });
      }
    } catch (err) {
      console.error('Failed to fetch payment methods settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/school-finance/payment-methods', settings);
      toast.success('Paramètres et coordonnées de paiement enregistrés avec succès dans Strapi');
    } catch (err: any) {
      console.error('Failed to save payment settings', err);
      toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'enregistrement des coordonnées de paiement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement des coordonnées...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard size={28} className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Configuration des Modalités de Paiement
            </h1>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
            Gérez les coordonnées bancaires, codes Orange Money / MTN MoMo et horaires de caisse affichés aux élèves et parents
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 shrink-0"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
        </Button>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50/70 border border-blue-200/60 p-5 rounded-3xl flex items-start gap-4 shadow-sm">
        <Info className="text-primary mt-1 shrink-0" size={22} />
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Gestion Centralisée des Modalités de Règlement</h4>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            Toutes les informations configurées sur cette page (IBAN, RIB, codes marchands Mobile Money, lieu et horaires de caisse) sont synchronisées en direct dans la base de données Strapi et s'affichent automatiquement dans le portail financier des élèves et parents.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-2 w-fit">
          <TabsTrigger value="bank" className="rounded-xl font-bold text-xs px-4 py-2.5 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Landmark size={15} />
            <span>Coordonnées Bancaires</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="rounded-xl font-bold text-xs px-4 py-2.5 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Smartphone size={15} />
            <span>Orange Money & MTN MoMo</span>
          </TabsTrigger>
          <TabsTrigger value="cashier" className="rounded-xl font-bold text-xs px-4 py-2.5 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Building size={15} />
            <span>Caisse & Contacts</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: BANK DETAILS ─────────────────────────────────────────── */}
        <TabsContent value="bank" className="space-y-6">
          <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Landmark size={22} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Virement & Dépôt Bancaire</h2>
                  <p className="text-xs text-slate-400 font-semibold">Paramétrez le compte bancaire officiel de l'école</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, isBankTransferActive: !settings.isBankTransferActive })}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  settings.isBankTransferActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {settings.isBankTransferActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                <span>{settings.isBankTransferActive ? 'Option Activée' : 'Option Désactivée'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Nom de la Banque
                </label>
                <Input
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="Ex: Banque Centrale / Vista Bank Guinée"
                  className="rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Titulaire du Compte
                </label>
                <Input
                  value={settings.accountHolder}
                  onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                  placeholder="Ex: 2CS COMPLEXE SCOLAIRE"
                  className="rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Numéro de Compte / RIB / IBAN
                </label>
                <Input
                  value={settings.rib}
                  onChange={(e) => setSettings({ ...settings, rib: e.target.value })}
                  placeholder="Ex: GN04 0001 2345 6789 0123 45"
                  className="rounded-xl font-mono font-bold text-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Code Guichet
                  </label>
                  <Input
                    value={settings.branchCode}
                    onChange={(e) => setSettings({ ...settings, branchCode: e.target.value })}
                    placeholder="Ex: 01001"
                    className="rounded-xl font-mono font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Code SWIFT / BIC
                  </label>
                  <Input
                    value={settings.swift}
                    onChange={(e) => setSettings({ ...settings, swift: e.target.value })}
                    placeholder="Ex: VISTGNCON"
                    className="rounded-xl font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                Consignes pour les Virements Bancaires
              </label>
              <Textarea
                value={settings.bankInstructions}
                onChange={(e) => setSettings({ ...settings, bankInstructions: e.target.value })}
                rows={3}
                placeholder="Ex: Mentionnez impérativement le N° de Facture et votre ID Élève en référence de votre virement..."
                className="rounded-xl font-normal text-xs"
              />
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: MOBILE MONEY ─────────────────────────────────────────── */}
        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orange Money Card */}
            <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-orange-50 text-orange-600">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Orange Money</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Code Marchand USSD Orange</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, isOrangeMoneyActive: !settings.isOrangeMoneyActive })}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    settings.isOrangeMoneyActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {settings.isOrangeMoneyActive ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} />}
                  <span>{settings.isOrangeMoneyActive ? 'Actif' : 'Inactif'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Code Marchand / Syntaxe USSD
                </label>
                <Input
                  value={settings.orangeMoneyMerchant}
                  onChange={(e) => setSettings({ ...settings, orangeMoneyMerchant: e.target.value })}
                  placeholder="Ex: #144*2*1*XXXXX#"
                  className="rounded-xl font-mono font-bold text-orange-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Instructions Orange Money
                </label>
                <Textarea
                  value={settings.orangeMoneyInstructions}
                  onChange={(e) => setSettings({ ...settings, orangeMoneyInstructions: e.target.value })}
                  rows={3}
                  placeholder="Composez le code USSD ci-dessus pour effectuer le paiement direct sécurisé."
                  className="rounded-xl text-xs"
                />
              </div>
            </Card>

            {/* MTN Mobile Money Card */}
            <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">MTN Mobile Money</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Code Marchand MTN MoMo</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, isMtnMoMoActive: !settings.isMtnMoMoActive })}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    settings.isMtnMoMoActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {settings.isMtnMoMoActive ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} />}
                  <span>{settings.isMtnMoMoActive ? 'Actif' : 'Inactif'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Code Court / Syntaxe MoMo
                </label>
                <Input
                  value={settings.mtnMoMoCode}
                  onChange={(e) => setSettings({ ...settings, mtnMoMoCode: e.target.value })}
                  placeholder="Ex: *440*XXXXXX#"
                  className="rounded-xl font-mono font-bold text-yellow-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Instructions MTN MoMo
                </label>
                <Textarea
                  value={settings.mtnMoMoInstructions}
                  onChange={(e) => setSettings({ ...settings, mtnMoMoInstructions: e.target.value })}
                  rows={3}
                  placeholder="Paiement marchand via le code court MTN Mobile Money."
                  className="rounded-xl text-xs"
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: CASHIER & CONTACT ────────────────────────────────────── */}
        <TabsContent value="cashier" className="space-y-6">
          <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Building size={22} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Guichet de Caisse & Service Comptabilité</h2>
                  <p className="text-xs text-slate-400 font-semibold">Emplacement physique, horaires d'ouverture et coordonnées directes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, isCashierActive: !settings.isCashierActive })}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  settings.isCashierActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {settings.isCashierActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                <span>{settings.isCashierActive ? 'Caisse Ouverte' : 'Caisse Fermée'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Emplacement du Guichet de Caisse
                </label>
                <Input
                  value={settings.cashierLocation}
                  onChange={(e) => setSettings({ ...settings, cashierLocation: e.target.value })}
                  placeholder="Ex: Bâtiment Administratif, RDC"
                  className="rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Horaires d'Ouverture de la Caisse
                </label>
                <Input
                  value={settings.cashierHours}
                  onChange={(e) => setSettings({ ...settings, cashierHours: e.target.value })}
                  placeholder="Ex: Lundi au Vendredi: 08h00 — 16h00"
                  className="rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Email du Service Comptabilité
                </label>
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="Ex: accounts@2cscomplexes.com"
                  className="rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Téléphone / WhatsApp Comptabilité
                </label>
                <Input
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  placeholder="Ex: +224 620 00 00 00"
                  className="rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                Notes & Consignes Administratives Additionnelles
              </label>
              <Textarea
                value={settings.additionalNotes}
                onChange={(e) => setSettings({ ...settings, additionalNotes: e.target.value })}
                rows={3}
                placeholder="Conservez précieusement vos reçus de versement pour tout contrôle administratif."
                className="rounded-xl text-xs font-normal"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
