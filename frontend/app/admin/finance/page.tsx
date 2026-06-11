'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, TrendingUp, ShieldAlert,
  Percent, CreditCard, Landmark, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Cell, LabelList
} from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

// ─── Currency formatter: 0.000.000,00 format ──────────────────────────────────
const fmtGNF = (v: number) => {
  const [int, dec] = Math.abs(v).toFixed(2).split('.');
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${v < 0 ? '-' : ''}${intFormatted},${dec}`;
};

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(Math.round(v));
};

// ─── Custom Tooltip for Line Chart ────────────────────────────────────────────
const LineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-4 text-xs min-w-[200px]">
      <p className="font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {fmtGNF(p.value)} GNF
        </p>
      ))}
    </div>
  );
};

// ─── Custom Tooltip for Bar Chart ─────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-4 text-xs min-w-[160px]">
      <p className="font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="font-bold text-slate-800">{fmtGNF(payload[0]?.value || 0)} GNF</p>
    </div>
  );
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function FinanceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Bar chart filters
  const [barMonth, setBarMonth] = useState<string>('ALL');
  const [barYear, setBarYear] = useState<string>(String(new Date().getFullYear()));

  const fetchStats = useCallback(async (year?: string) => {
    setLoading(true);
    try {
      const yr = year || barYear;
      const res = await api.get(`/school-finance/stats?year=${yr}`);
      setStats(res.data);
    } catch (e: any) {
      toast.error('Échec de la synchronisation du grand livre d\'analyse financière');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [barYear]);

  // Initial load
  useEffect(() => { fetchStats(barYear); }, []);

  // Re-fetch when year changes
  useEffect(() => {
    setBarMonth('ALL'); // reset month filter when year changes
    fetchStats(barYear);
  }, [barYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Payment completion ratio — use billedStudents as denominator
  const paidRatio = useMemo(() => {
    const billed = stats?.billedStudents || 0;
    const paid = stats?.paidStudents || 0;
    return billed > 0 ? Math.round((paid / billed) * 100) : 0;
  }, [stats]);

  // Bar chart data — uses yearlyTrends per-month category breakdown when a month is selected
  const barData = useMemo(() => {
    if (!stats) return [];

    if (barMonth === 'ALL') {
      // All-time annual totals for selected year
      return [
        { name: 'Scolarité', value: stats.tuitionRevenue || 0, fill: '#3b82f6' },
        { name: 'Transport', value: stats.transportationRevenue || 0, fill: '#10b981' },
        { name: 'T-Shirt / Uniform', value: stats.tshirtRevenue || 0, fill: '#8b5cf6' },
        { name: 'Inscription', value: stats.registrationRevenue || 0, fill: '#f59e0b' },
        { name: 'Autre', value: stats.otherRevenue || 0, fill: '#64748b' },
        { name: 'Dépenses de salaire', value: stats.salaryExpenses || 0, fill: '#f43f5e' },
      ];
    }

    // Specific month — use per-month category data from yearlyTrends
    const monthIndex = parseInt(barMonth) - 1; // barMonth is "1".."12"
    const m = stats.yearlyTrends?.[monthIndex];
    if (!m) return [];
    return [
      { name: 'Scolarité', value: m.tuition || 0, fill: '#3b82f6' },
      { name: 'Transport', value: m.transport || 0, fill: '#10b981' },
      { name: 'T-Shirt/Uniform', value: m.tshirt || 0, fill: '#8b5cf6' },
      { name: 'Inscription', value: m.registration || 0, fill: '#f59e0b' },
      { name: 'Autre', value: m.other || 0, fill: '#64748b' },
      { name: 'Dépenses de salaire', value: m.salary || 0, fill: '#f43f5e' },
    ];
  }, [stats, barMonth]);

  // Line chart data
  const lineData = useMemo(() => {
    if (!stats?.yearlyTrends) return [];
    return stats.yearlyTrends;
  }, [stats]);

  const kpis = [
    {
      title: 'Chiffre d\'affaire annuel',
      value: `${fmtGNF(stats?.monthlyRevenue || 0)} GNF`,
      desc: `Toutes les paiements approuvés pour ${barYear}`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      title: 'Dette impayée',
      value: `${fmtGNF(stats?.outstandingDebt || 0)} GNF`,
      desc: 'Solde des factures impayées',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-100'
    },
    {
      title: 'Dépenses de salaire',
      value: `${fmtGNF(stats?.salaryExpenses || 0)} GNF`,
      desc: 'Dépenses de salaire',
      icon: CreditCard,
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      title: 'Pourcentage de paiement',
      value: `${paidRatio}%`,
      desc: `${stats?.paidStudents || 0} des ${stats?.billedStudents || 0} élèves facturés entièrement payés`,
      icon: Percent,
      color: paidRatio >= 75
        ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
        : paidRatio >= 40
          ? 'text-amber-600 bg-amber-50 border-amber-100'
          : 'text-rose-600 bg-rose-50 border-rose-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Synchronisation de la balance comptable...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none italic uppercase">Centre de commande de la finance</h1>
          <p className="text-sm text-slate-500 font-medium">Total des audits du grand livre en temps réel et analyse de l'achèvement des paiements</p>
        </div>
        <button
          onClick={() => fetchStats(barYear)}
          className="flex items-center gap-2 px-4 h-11 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-300 shadow-sm text-xs font-black uppercase tracking-wider text-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Synchroniser le grand livre
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border-0 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black tracking-wider text-slate-400 uppercase">{kpi.title}</span>
                  <div className={`p-2.5 rounded-2xl border ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{kpi.value}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{kpi.desc}</p>
                </div>
                {/* Progress bar for payment ratio */}
                {kpi.title === 'Pourcentage de paiement' && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${paidRatio >= 75 ? 'bg-emerald-500' : paidRatio >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${paidRatio}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Line Chart: Revenue & Debt Dynamics ── */}
        <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Dynamiques des revenus et des dettes ({barYear})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={700}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={700}
                    tickFormatter={(v) => fmtShort(v)}
                    tick={{ fill: '#64748b' }}
                    width={55}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue GNF"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="debt"
                    name="Unpaid Debt GNF"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f43f5e' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ── Bar Chart: Revenue Allocations ── */}
        <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" /> Répartition des revenus (GNF)
              </CardTitle>
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Select value={barMonth} onValueChange={setBarMonth}>
                  <SelectTrigger className="h-8 w-[110px] rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold">
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les mois</SelectItem>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={barYear} onValueChange={setBarYear}>
                  <SelectTrigger className="h-8 w-[90px] rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={9}
                    fontWeight={700}
                    tick={{ fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={700}
                    tickFormatter={(v) => fmtShort(v)}
                    tick={{ fill: '#64748b' }}
                    width={55}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="value" name="Amount GNF" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    {/* Value labels above bars — always visible */}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v: unknown) => { const n = Number(v); return n > 0 ? fmtShort(n) : ''; }}
                      style={{ fontSize: '10px', fontWeight: 700, fill: '#475569' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Value table below chart — always visible, mobile-friendly */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {barData.map((d) => (
                <div key={d.name} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] font-bold text-slate-600 truncate">{d.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 ml-2 shrink-0">{fmtGNF(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
