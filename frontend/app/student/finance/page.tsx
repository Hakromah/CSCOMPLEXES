'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, DollarSign, Download, CreditCard, ShieldAlert, FileText } from 'lucide-react';
import api from '@/lib/api';
import { generateStatement, StatementData } from '@/lib/pdf-generator';

interface Invoice {
  id: number;
  invoiceNumber: string;
  month: string;
  year: number;
  dueDate: string;
  subtotal: number;
  totalPaid: number;
  status: string;
  currency?: string;
}

interface Balance {
  totalCharged: number;
  totalPaid: number;
  outstandingBalance: number;
  currency: string;
}

export default function StudentFinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, balanceRes, providersRes] = await Promise.all([
        api.get('/student/invoices'),
        api.get('/student/balance'),
        api.get('/finance/payment-providers') // public endpoint for active options
      ]);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setBalance(balanceRes.data);
      setProviders(Array.isArray(providersRes.data) ? providersRes.data : []);
    } catch (error) {
      toast.error('Failed to load financial records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadPDFStatement = () => {
    if (!balance || invoices.length === 0) return;
    try {
      const statementData: StatementData = {
        studentName: 'Student Statement',
        period: new Date().getFullYear().toString(),
        totalCharged: balance.totalCharged,
        totalPaid: balance.totalPaid,
        totalOutstanding: balance.outstandingBalance,
        currency: balance.currency || 'GNF',
        invoices: invoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          month: inv.month,
          year: inv.year,
          dueDate: inv.dueDate,
          subtotal: inv.subtotal,
          totalPaid: inv.totalPaid,
          remainingBalance: Math.max(0, inv.subtotal - inv.totalPaid),
          status: inv.status,
          currency: inv.currency
        }))
      };
      const doc = generateStatement(statementData);
      doc.save(`financial-statement-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Statement PDF generated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Finance Portal...</p>
      </div>
    );
  }

  const currency = balance?.currency || 'GNF';

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Student Finance</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            My <span className="text-primary">Accounts.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Check outstanding invoices, payments, and print statement
          </p>
        </div>
        {invoices.length > 0 && (
          <Button
            onClick={downloadPDFStatement}
            className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-12 px-6 font-black transition-all cursor-pointer shadow-md"
          >
            <Download size={16} className="mr-2" /> Download Statement
          </Button>
        )}
      </header>

      {/* Balance Summary Cards */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
            <CardContent className="p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic mt-1">
                {currency} {balance.totalCharged.toLocaleString()}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 mt-2">Cumulative fees charged to your record</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-100 rounded-3xl overflow-hidden shadow-sm bg-emerald-50/20">
            <CardContent className="p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Paid</span>
              <h2 className="text-3xl font-black text-emerald-700 tracking-tighter italic mt-1">
                {currency} {balance.totalPaid.toLocaleString()}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 mt-2">Confirmed payments credited</p>
            </CardContent>
          </Card>

          <Card className="border border-rose-100 rounded-3xl overflow-hidden shadow-sm bg-rose-50/20">
            <CardContent className="p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Outstanding Balance</span>
              <h2 className="text-3xl font-black text-rose-700 tracking-tighter italic mt-1">
                {currency} {balance.outstandingBalance.toLocaleString()}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 mt-2">Required payment to clear account</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices List */}
      <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-row items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" /> Invoice History
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">
              No invoices found for your student profile.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Invoice #</TableHead>
                  <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Period</TableHead>
                  <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Due Date</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Charged</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Paid</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Remaining</TableHead>
                  <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const rem = Math.max(0, inv.subtotal - inv.totalPaid);
                  return (
                    <TableRow key={inv.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-8 font-mono text-xs font-bold text-slate-800">{inv.invoiceNumber}</TableCell>
                      <TableCell className="font-bold text-slate-600 text-xs">{inv.month} {inv.year}</TableCell>
                      <TableCell className="text-slate-500 font-medium text-xs">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800 text-xs">
                        {currency} {inv.subtotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 text-xs">
                        {currency} {inv.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-black text-rose-600 text-xs">
                        {currency} {rem.toLocaleString()}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Badge className={`uppercase text-[9px] font-black border-none rounded-full px-3 py-1 ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Providers Skeletons */}
      <div className="space-y-4">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2">
          <CreditCard size={15} /> Payment Gateways
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {providers.map((p: any) => (
            <Card key={p.type} className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">{p.name}</h4>
                  <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest text-rose-500 bg-rose-50/50 border-rose-100">
                    Inactive
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  Gateway integration configured for {p.name}. Direct payments via portal currently locked.
                </p>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 p-2 rounded-xl">
                  <ShieldAlert size={12} className="flex-shrink-0" /> Contact accountant to enable
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
