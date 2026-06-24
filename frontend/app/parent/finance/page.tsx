/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CreditCard, AlertCircle, ChevronRight, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/lib/api';
import type { FamilyFinancialSummary, StudentFinancialSummary } from '@/types/school';

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  DRAFT: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-red-100 text-red-700',
};

const PIE_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#ea580c', '#db2777'];

export default function ParentFinancePage() {
  const [data, setData] = useState<FamilyFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/finance')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  const totalCharged = data?.totalCharged || 0;
  const totalPaid = data?.totalPaid || 0;
  const totalOutstanding = data?.totalOutstanding || 0;
  const children: StudentFinancialSummary[] = data?.children || [];

  const pieData = [
    { name: 'Paid', value: totalPaid },
    { name: 'Outstanding', value: totalOutstanding },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Finance</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Financial Overview</h1>
      </motion.div>

      {/* Outstanding Alert */}
      {totalOutstanding > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">Outstanding Balance</p>
            <p className="text-xs text-red-700 mt-0.5">
              You have GNF {totalOutstanding.toLocaleString()} outstanding. Please contact the accounting office.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Charged', value: totalCharged, color: 'bg-blue-50 text-blue-700', icon: CreditCard },
          { label: 'Total Paid', value: totalPaid, color: 'bg-green-50 text-green-700', icon: TrendingDown },
          { label: 'Outstanding', value: totalOutstanding, color: totalOutstanding > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700', icon: AlertCircle },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${card.color} rounded-2xl p-6`}
          >
            <card.icon className="w-6 h-6 mb-3 opacity-70" />
            <p className="text-2xl font-black">GNF {card.value.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pie Chart + Per-Child Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Payment Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `GNF ${Number(v || 0).toLocaleString()}`} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Per Student</h2>
          <div className="space-y-3">
            {children.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No financial data</p>
            ) : (
              children.map(child => {
                const name = (child.student as any)?.firstName
                  ? `${(child.student as any).firstName} ${(child.student as any).lastName || ''}`
                  : (child.student as any)?.username || 'Student';
                const hasBalance = child.outstandingBalance > 0;
                return (
                  <Link key={(child.student as any)?.id} href={`/parent/finance/${(child.student as any)?.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                        {name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{name}</p>
                        <p className={`text-xs font-medium ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                          {hasBalance ? `GNF ${child.outstandingBalance.toLocaleString()} due` : 'Up to date'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
