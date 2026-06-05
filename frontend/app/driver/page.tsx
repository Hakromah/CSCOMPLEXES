'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard, Download, Calendar, BadgeAlert, Bus, UserCheck, ShieldCheck, MapPin
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export default function DriverDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const [meRes, recordRes, paymentRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/salary-records?populate=*'),
        api.get('/salary-payments?populate=*')
      ]);

      setProfile(meRes.data);

      // Filter salary statements specifically belonging to this driver
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
    fetchDriverData();
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
      doc.text('OFFICIAL DIGITAL DRIVER PAYSLIP RECEIPT', 15, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.text('SALARY RECEIPT', 15, 70);
      
      doc.setFontSize(10);
      doc.text(`Disbursed Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`, 15, 80);
      doc.text(`Receipt Reference: ${receiptData.receiptNumber || 'REC-TEMP'}`, 15, 87);

      doc.text(`Employee Name: ${profile?.name}`, 120, 80);
      doc.text(`Role Badge: DRIVER`, 120, 87);

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
    return <div className="p-12 text-center font-bold text-slate-400 uppercase animate-pulse">Syncing Driver Portal...</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Driver Payout Portal</h1>
          <p className="text-sm text-slate-500 font-medium">Welcome back, <span className="font-extrabold text-blue-600">{profile?.name}</span>! Track your salary deposits and route info.</p>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid gap-6 md:grid-cols-3">
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
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Route Status</p>
              <h3 className="text-md font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Active Route Assigned
              </h3>
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

      {/* Route Detail Card */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Bus className="w-4 h-4 text-slate-400" /> Transit Route Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Primary Route: Campus Express shuttle</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                Stops: Conakry Center Bus Terminus → AMFOFANA Main Campus Gates. Daily departure hours: 07:15 AM & 17:30 PM.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
