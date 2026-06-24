'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { generateStatement, generateReceipt } from '@/lib/pdf-generator';
import type { StudentInvoice, StudentPayment } from '@/types/school';

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  DRAFT: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function ChildStatementPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = React.use(params);
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [studentName, setStudentName] = useState('');
  const [totalCharged, setTotalCharged] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/parent/finance/${studentId}`),
      api.get(`/parent/children/${studentId}`),
    ])
      .then(([finRes, studentRes]) => {
        setInvoices(finRes.data?.invoices || []);
        setPayments(finRes.data?.payments || []);
        setTotalCharged(finRes.data?.totalCharged || 0);
        setTotalPaid(finRes.data?.totalPaid || 0);
        const s = studentRes.data;
        setStudentName(s?.firstName ? `${s.firstName} ${s.lastName || ''}` : s?.username || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  const outstanding = totalCharged - totalPaid;

  const handleDownloadStatement = () => {
    const doc = generateStatement({
      studentName,
      period: new Date().getFullYear().toString(),
      invoices: invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        month: inv.month,
        year: inv.year,
        dueDate: inv.dueDate,
        subtotal: inv.subtotal,
        totalPaid: inv.totalPaid,
        remainingBalance: inv.remainingBalance,
        status: inv.status,
        currency: inv.currency,
      })),
      totalCharged,
      totalPaid,
      totalOutstanding: outstanding,
    });
    doc.save(`statement_${studentName.replace(/\s+/g, '_')}.pdf`);
    toast.success('Statement downloaded');
  };

  const handleDownloadReceipt = (payment: StudentPayment) => {
    const doc = generateReceipt({
      receiptNumber: payment.paymentNumber,
      studentName,
      date: new Date(payment.paymentDate).toLocaleDateString('en-GB'),
      amount: payment.amount,
      currency: payment.currency || 'GNF',
      paymentMethod: payment.paymentMethod,
      description: `${payment.paymentCategory} — ${payment.invoice?.invoiceNumber || 'Payment'}`,
    });
    doc.save(`receipt_${payment.paymentNumber}.pdf`);
    toast.success('Receipt downloaded');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <Link href="/parent/finance" className="hover:text-primary">Finance</Link>
            <span>/</span>
            <span className="text-slate-700">{studentName}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{studentName} — Statement</h1>
        </div>
        <button
          onClick={handleDownloadStatement}
          className="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Charged', value: totalCharged, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Total Paid', value: totalPaid, cls: 'bg-green-50 text-green-700' },
          { label: 'Outstanding', value: outstanding, cls: outstanding > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`${s.cls} rounded-2xl p-5 text-center`}>
            <p className="text-2xl font-black">GNF {s.value.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No invoices</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['Invoice #', 'Period', 'Due Date', 'Charged', 'Paid', 'Balance', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map(inv => (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.month} {inv.year}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">GNF {inv.subtotal.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">GNF {inv.totalPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-red-700">GNF {inv.remainingBalance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_COLORS[inv.status] || ''}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No payments recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['Payment #', 'Date', 'Method', 'Amount', 'Category', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(pay => (
                  <motion.tr key={pay.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{pay.paymentNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(pay.paymentDate).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">{pay.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-700">GNF {pay.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{pay.paymentCategory}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[pay.status] || ''}`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDownloadReceipt(pay)}
                        className="flex items-center gap-1 text-primary hover:bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Download className="w-3 h-3" /> Receipt
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
