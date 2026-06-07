'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard, Download, UserCheck, LogOut, School,
  Activity, UserCircle, RefreshCw, Wallet, AlertCircle, Bus
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import Cookies from 'js-cookie';
import { SCHOOL_CONFIG } from '@/lib/school-config';

// ─── Currency formatter ────────────────────────────────────────────────────────
const fmtGNF = (v: number) => {
  const [int, dec] = Math.abs(v).toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'PAID'           ? 'bg-emerald-500 hover:bg-emerald-600' :
    status === 'PARTIALLY_PAID' ? 'bg-amber-500 hover:bg-amber-600' :
    status === 'APPROVED'       ? 'bg-blue-600 hover:bg-blue-700' :
    status === 'SUBMITTED'      ? 'bg-violet-500 hover:bg-violet-600' :
    status === 'REJECTED'       ? 'bg-rose-500 hover:bg-rose-600' :
    'bg-slate-300 text-slate-800';
  return <Badge className={cls}>{status}</Badge>;
}

export default function DriverDashboard() {
  const [profile,        setProfile]        = useState<any>(null);
  const [salaryRecords,  setSalaryRecords]  = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, payrollRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/school-finance/data/my-payroll')
      ]);
      setProfile(meRes.data);
      setSalaryRecords(payrollRes.data?.salaryRecords  || []);
      setSalaryPayments(payrollRes.data?.salaryPayments || []);
    } catch (e: any) {
      toast.error('Failed to load your payroll statements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    const tid = toast.loading('Logging out...');
    try {
      await api.post('/auth/logout', {});
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('userRole',    { path: '/' });
      toast.success('Logged out successfully', { id: tid });
      window.location.href = '/login';
    } catch {
      toast.error('Logout failed', { id: tid });
    }
  };

  const downloadPayslip = async (rec: any) => {
    const tid = toast.loading('Generating payslip PDF...');
    try {
      const base  = Number(rec.baseSalary  || 0);
      const allow = Number(rec.allowances  || 0);
      const ded   = Number(rec.deductions  || 0);
      const net   = Number(rec.netSalary   || 0);
      const recordPayments  = salaryPayments.filter(p => p.salaryRecordId === rec.id && p.status === 'APPROVED');
      const totalDisbursed  = recordPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding     = Math.max(0, net - totalDisbursed);

      const doc = new jsPDF();
      doc.setDrawColor(...SCHOOL_CONFIG.accentColor);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);
      doc.setFillColor(...SCHOOL_CONFIG.primaryColor);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(SCHOOL_CONFIG.name, 15, 23);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${SCHOOL_CONFIG.subtitle} — DRIVER SALARY PAYSLIP`, 15, 30);
      doc.text(SCHOOL_CONFIG.contact, 15, 36);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 22);

      doc.setTextColor(...SCHOOL_CONFIG.primaryColor);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('SALARY PAYSLIP', 15, 70);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Record ID: ${rec.recordNumber || 'N/A'}`, 15, 80);
      doc.text(`Pay Period: ${rec.month} ${rec.year}`, 15, 87);
      doc.text(`Status: ${rec.status}`, 15, 94);
      if (rec.notes) doc.text(`Notes: ${rec.notes}`, 15, 101);
      doc.setFont('Helvetica', 'bold');
      doc.text('Employee:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name: ${profile?.name || profile?.username || 'N/A'}`, 120, 87);
      doc.text(`Role: DRIVER`, 120, 94);
      doc.text(`ID: ${profile?.userId || 'N/A'}`, 120, 101);

      autoTable(doc, {
        startY: 115,
        head: [['Payroll Component', 'Amount (GNF)']],
        body: [
          ['Base Salary',     fmtGNF(base)],
          ['Allowances (+)',  `+ ${fmtGNF(allow)}`],
          ['Deductions (−)', `− ${fmtGNF(ded)}`],
          ['Net Salary Due',  fmtGNF(net)],
          ['Total Disbursed', fmtGNF(totalDisbursed)],
          ['Outstanding',     outstanding > 0 ? fmtGNF(outstanding) : '—'],
        ],
        theme: 'striped',
        headStyles: { fillColor: SCHOOL_CONFIG.primaryColor },
        bodyStyles: { fontSize: 10 },
        didParseCell: (data: any) => {
          if (data.row.index === 3) data.cell.styles.fontStyle = 'bold';
          if (data.row.index === 5 && outstanding > 0) data.cell.styles.textColor = [220, 38, 38];
        }
      });

      const qrContent = `${SCHOOL_CONFIG.name}\nDriver Payslip\nRecord: ${rec.recordNumber}\nEmployee: ${profile?.name}\nPeriod: ${rec.month} ${rec.year}\nNet: ${fmtGNF(net)} GNF\nStatus: ${rec.status}\nVerify: ${SCHOOL_CONFIG.verifyUrl}`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Scan to verify', 163, 286);

      doc.save(`Payslip-${rec.recordNumber || rec.id}.pdf`);
      toast.success('Payslip downloaded successfully', { id: tid });
    } catch (e: any) {
      toast.error('PDF generation failed', { id: tid });
    }
  };

  const totalDisbursed = salaryPayments
    .filter(p => p.status === 'APPROVED')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="font-bold text-slate-500 uppercase text-sm tracking-wide">Syncing Driver Portal...</p>
      </div>
    );
  }

  return (
    <div className="flex max-md:flex-col min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-72 border-r border-slate-100 h-screen sticky top-0 z-50 bg-white">
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-50">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-200">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-black text-base tracking-tighter text-slate-900 italic uppercase leading-none block">
              {SCHOOL_CONFIG.name.split(' ')[0]}
            </span>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Driver Portal</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end p-4">
          <div className="bg-slate-900 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700">
                <UserCircle className="w-7 h-7 text-slate-500" />
              </div>
              <div className="overflow-hidden">
                <span className="font-black text-sm text-white truncate italic uppercase block">
                  {profile?.name || profile?.username || 'Loading...'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">DRIVER Session</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full justify-center gap-2 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 border border-white/10 rounded-xl transition-all h-10 text-[10px] font-black uppercase tracking-[0.15em]"
            >
              <LogOut className="w-3.5 h-3.5" /> End Session
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl"><Bus className="h-4 w-4 text-white" /></div>
          <span className="font-black text-base italic uppercase tracking-tight">Driver Portal</span>
        </div>
        <Button onClick={handleLogout} size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs font-bold">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </Button>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 italic uppercase">Driver Payout Portal</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Welcome back, <span className="font-extrabold text-blue-600">{profile?.name || profile?.username}</span>! Track your salary statements.
            </p>
          </div>
          <Button onClick={fetchData} size="sm" variant="outline" className="gap-2 rounded-xl text-xs font-bold uppercase hidden md:flex">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100"><CreditCard className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Total Disbursed</p>
                <h3 className="text-lg font-black text-slate-900">{fmtGNF(totalDisbursed)} <span className="text-xs text-slate-400">GNF</span></h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100"><Wallet className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Salary Records</p>
                <h3 className="text-lg font-black text-slate-900">{salaryRecords.length} <span className="text-xs text-slate-400">Total</span></h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100"><UserCheck className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Employee ID</p>
                <h3 className="text-sm font-black text-slate-900 tracking-wider">{profile?.userId || '—'}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records table */}
        <Card className="border-0 shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-slate-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-500" /> Your Salary Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-bold text-slate-700">Record ID</TableHead>
                    <TableHead className="font-bold text-slate-700">Period</TableHead>
                    <TableHead className="font-bold text-slate-700">Net Salary</TableHead>
                    <TableHead className="font-bold text-slate-700">Disbursed</TableHead>
                    <TableHead className="font-bold text-slate-700">Outstanding</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <AlertCircle className="w-8 h-8" />
                          <p className="font-bold uppercase text-xs">No payroll records found</p>
                          <p className="text-xs">Your salary records will appear here once created by the accountant.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : salaryRecords.map((rec: any) => {
                    const recordPayments = salaryPayments.filter(p => p.salaryRecordId === rec.id && p.status === 'APPROVED');
                    const disbursed   = recordPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
                    const outstanding = Math.max(0, Number(rec.netSalary || 0) - disbursed);
                    const canDownload = ['APPROVED', 'PAID', 'PARTIALLY_PAID'].includes(rec.status);
                    return (
                      <TableRow key={rec.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-900 text-xs">{rec.recordNumber}</TableCell>
                        <TableCell className="text-sm text-slate-600 font-semibold">{rec.month} {rec.year}</TableCell>
                        <TableCell className="font-black text-blue-600">{fmtGNF(Number(rec.netSalary || 0))} <span className="text-[10px] text-blue-300">GNF</span></TableCell>
                        <TableCell className="font-bold text-emerald-600">{fmtGNF(disbursed)} <span className="text-[10px] text-emerald-300">GNF</span></TableCell>
                        <TableCell className={`font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {outstanding > 0 ? `${fmtGNF(outstanding)} GNF` : '—'}
                        </TableCell>
                        <TableCell><StatusBadge status={rec.status} /></TableCell>
                        <TableCell className="text-right">
                          {canDownload ? (
                            <Button onClick={() => downloadPayslip(rec)} size="sm" variant="outline"
                              className="rounded-xl gap-1.5 text-xs font-bold uppercase tracking-wide">
                              <Download className="w-3.5 h-3.5" /> PDF
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-300 font-semibold">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
