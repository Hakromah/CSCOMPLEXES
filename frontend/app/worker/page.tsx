'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard, Download, Calendar, BadgeAlert, UserCheck, ShieldCheck
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export default function WorkerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const [meRes, recordRes, paymentRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/salary-records?populate=*'),
        api.get('/salary-payments?populate=*')
      ]);

      setProfile(meRes.data);

      const myRecords = (recordRes.data?.data || recordRes.data || []).filter(
        (r: any) => (r.attributes || r).staff?.id === meRes.data.id
      );
      const myPayments = (paymentRes.data?.data || paymentRes.data || []).filter(
        (p: any) => (p.attributes || p).staff?.id === meRes.data.id
      );

      setSalaryRecords(myRecords);
      setSalaryPayments(myPayments);
    } catch (e: any) {
      toast.error('Failed to load payroll statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const downloadPayslip = async (paymentId: number) => {
    const tid = toast.loading('Compiling payslip...');
    try {
      const pmRes = await api.get(`/salary-payments/${paymentId}?populate=*`);
      const paymentData = pmRes.data?.data?.attributes || pmRes.data?.data || pmRes.data;

      const rcRes = await api.get(`/receipts?filters[salaryPayment][id]=${paymentId}`);
      const receiptData = rcRes.data?.[0] || {};

      const doc = new jsPDF();
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      doc.setFillColor(15, 23, 42);
      doc.rect(5, 5, 200, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text('AMFOFANA ACADEMY', 15, 23);
      doc.setFontSize(9);
      doc.text('OFFICIAL DIGITAL WORKER PAYSLIP RECEIPT', 15, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.text('SALARY RECEIPT', 15, 70);
      
      doc.setFontSize(10);
      doc.text(`Disbursed Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`, 15, 80);
      doc.text(`Receipt Reference: ${receiptData.receiptNumber || 'REC-TEMP'}`, 15, 87);

      doc.text(`Employee Name: ${profile?.name}`, 120, 80);
      doc.text(`Role Badge: SUPPORT STAFF`, 120, 87);

      const base = Number(paymentData.salaryRecord?.baseSalary || 0);
      const allow = Number(paymentData.salaryRecord?.allowances || 0);
      const ded = Number(paymentData.salaryRecord?.deductions || 0);

      autoTable(doc, {
        startY: 115,
        head: [['Component', 'Amount']],
        body: [
          ['Base Salary', `${base.toLocaleString()} GNF`],
          ['Allowances', `+ ${allow.toLocaleString()} GNF`],
          ['Deductions', `- ${ded.toLocaleString()} GNF`],
          ['Total Net Payout', `${Number(paymentData.amount).toLocaleString()} GNF`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      const qrDataUrl = await QRCode.toDataURL(receiptData.qrCode || 'https://verify.amfofana.edu');
      doc.addImage(qrDataUrl, 'PNG', 140, finalY + 15, 45, 45);

      doc.save(`Payslip-${paymentData.paymentNumber || 'GEN'}.pdf`);
      toast.success('Payslip compiled safely', { id: tid });
    } catch (e: any) {
      toast.error('Export failed', { id: tid });
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-bold text-slate-400 uppercase animate-pulse">Syncing Support Portal...</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Support Staff Portal</h1>
          <p className="text-sm text-slate-500 font-medium">Welcome back, <span className="font-extrabold text-blue-600">{profile?.name}</span>! Track your salary deposits and statements.</p>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Deposits</p>
              <h3 className="text-xl font-black text-slate-900">{salaryPayments.filter(p => (p.attributes || p).status === 'APPROVED').length} Payslips</h3>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Employee ID</p>
              <h3 className="text-sm font-black text-slate-900 tracking-wider">{profile?.userId}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Salary history */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Your Payslip History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Billing Reference</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Payout Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Export</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryPayments.map((p: any) => {
                const actual = p.attributes || p;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-slate-900">{actual.paymentNumber}</TableCell>
                    <TableCell className="font-semibold text-slate-600">
                      {actual.salaryRecord?.month || actual.month || 'June'} {actual.salaryRecord?.year || actual.year || 2026}
                    </TableCell>
                    <TableCell className="font-black text-blue-600">{Number(actual.amount).toLocaleString()} GNF</TableCell>
                    <TableCell><Badge className="bg-emerald-500">{actual.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button 
                        onClick={() => downloadPayslip(p.id)}
                        size="sm" 
                        variant="outline"
                        className="rounded-lg gap-2 text-xs font-bold uppercase tracking-wider"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {salaryPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="p-8 text-center font-bold text-slate-400 uppercase text-xs">No payroll deposits logged yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
