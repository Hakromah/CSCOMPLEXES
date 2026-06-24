'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard, Download, UserCheck, LogOut, School,
  Activity, UserCircle, RefreshCw, Wallet, AlertCircle, Calendar, Bell
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import Cookies from 'js-cookie';
import { SCHOOL_CONFIG } from '@/lib/school-config';

interface PayrollPortalProps {
  role: 'DRIVER' | 'WORKER';
  icon: any;
  portalName: string;
}

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

export default function PayrollPortal({ role, icon: Icon, portalName }: PayrollPortalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, payrollRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/school-finance/data/my-payroll')
      ]);
      setProfile(meRes.data);
      setSalaryRecords(payrollRes.data?.salaryRecords || []);
      setSalaryPayments(payrollRes.data?.salaryPayments || []);
    } catch (e: any) {
      toast.error('Failed to load your payroll statements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    const tid = toast.loading('Logging out...');
    try {
      await api.post('/auth/logout', {});
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('userRole', { path: '/' });
      toast.success('Logged out successfully', { id: tid });
      window.location.href = '/login';
    } catch {
      toast.dismiss(tid);
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('userRole', { path: '/' });
      window.location.href = '/login';
    }
  };

  const downloadPayslip = async (rec: any) => {
    const tid = toast.loading('Generating payslip PDF...');
    try {
      const base = Number(rec.baseSalary || 0);
      const allow = Number(rec.allowances || 0);
      const ded = Number(rec.deductions || 0);
      const net = Number(rec.netSalary || 0);
      const recordPayments = salaryPayments.filter(p => p.salaryRecordId === rec.id && p.status === 'APPROVED');
      const totalDisbursed = recordPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding = Math.max(0, net - totalDisbursed);

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
      doc.text(`${SCHOOL_CONFIG.subtitle} — ${role} SALARY PAYSLIP`, 15, 30);
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
      doc.text(`Role: ${role}`, 120, 94);
      doc.text(`ID: ${profile?.userId || 'N/A'}`, 120, 101);

      autoTable(doc, {
        startY: 115,
        head: [['Payroll Component', 'Amount (GNF)']],
        body: [
          ['Base Salary', fmtGNF(base)],
          ['Allowances (+)', `+ ${fmtGNF(allow)}`],
          ['Deductions (−)', `− ${fmtGNF(ded)}`],
          ['Net Salary Due', fmtGNF(net)],
          ['Total Disbursed', fmtGNF(totalDisbursed)],
          ['Outstanding', outstanding > 0 ? fmtGNF(outstanding) : '—'],
        ],
        theme: 'striped',
        headStyles: { fillColor: SCHOOL_CONFIG.primaryColor },
        bodyStyles: { fontSize: 10 },
        didParseCell: (data: any) => {
          if (data.row.index === 3) data.cell.styles.fontStyle = 'bold';
          if (data.row.index === 5 && outstanding > 0) data.cell.styles.textColor = [220, 38, 38];
        }
      });

      const qrContent = `${SCHOOL_CONFIG.name}\n${role} Payslip\nRecord: ${rec.recordNumber}\nEmployee: ${profile?.name}\nPeriod: ${rec.month} ${rec.year}\nNet: ${fmtGNF(net)} GNF\nStatus: ${rec.status}\nVerify: ${SCHOOL_CONFIG.verifyUrl}`;
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

  const pendingRecords = salaryRecords.filter(r => !['PAID'].includes(r.status)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-3">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="font-bold text-slate-500 uppercase text-sm tracking-wide">Syncing Payroll Portal...</p>
      </div>
    );
  }

  // Sidebar navigation items for driver/worker
  const sidebarItems = role === 'DRIVER' ? [
    { name: 'Dashboard', href: '/driver' },
    { name: 'My Schedule', href: '/driver/schedule' },
    { name: 'Notifications', href: '/driver/notifications' }
  ] : [
    { name: 'Dashboard', href: '/worker' }
  ];

  return (
    <div className="flex max-md:flex-col min-h-screen bg-[#F8FAFC]">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-72 border-r border-slate-100 h-screen sticky top-0 z-50 bg-white">
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-50">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-200">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-black text-base tracking-tighter text-slate-900 italic uppercase leading-none block">
              {SCHOOL_CONFIG.name.split(' ')[0]}
            </span>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{portalName}</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 px-4 py-6 space-y-6">
          <nav className="flex flex-col gap-1.5">
            {sidebarItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 h-11 px-4 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-950 transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>

        <div className="p-4">
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
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">{role} Session</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full justify-center gap-2 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 border border-white/10 rounded-xl transition-all h-10 text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Close Session
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <Wallet className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Financial Summary</span>
            </div>
            <h1 className="text-[clamp(1.4rem,3vw,2.5rem)] font-black text-slate-900 tracking-tighter italic uppercase">
              Payroll <span className="text-blue-600">Statement.</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              Verify monthly payslips, confirmed disbursements, and download official records
            </p>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            className="rounded-2xl border-slate-200 hover:border-slate-300 h-12 px-5 font-bold text-slate-600 hover:text-slate-950 flex items-center gap-2 cursor-pointer bg-white"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Portal
          </Button>
        </header>

        {/* Info Banner for pending items */}
        {pendingRecords > 0 && (
          <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Awaiting Disbursement</p>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                You have <span className="font-black underline">{pendingRecords} payroll statement(s)</span> pending disbursement or approval by the accounting division.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cleared Salary</span>
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                {fmtGNF(totalDisbursed)} <span className="text-lg font-bold text-slate-400">GNF</span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                <UserCheck className="w-4 h-4" /> Confirmed transferred payouts
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Outstanding Balance</span>
                <CreditCard className="w-5 h-5 text-rose-500" />
              </div>
              {(() => {
                const totalNet = salaryRecords.reduce((s, r) => s + Number(r.netSalary || 0), 0);
                const outstanding = Math.max(0, totalNet - totalDisbursed);
                return (
                  <>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                      {fmtGNF(outstanding)} <span className="text-lg font-bold text-slate-400">GNF</span>
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-rose-600 font-black uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" /> Awaiting next bank distribution cycle
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Salary Records Card */}
        <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
          <CardHeader className="px-8 py-5 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Monthly Roster Statements</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified payslips issued per calendar cycle</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {salaryRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold italic text-sm">
                No salary statements logged in your registry database.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">Pay Period</TableHead>
                    <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Base Salary</TableHead>
                    <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Allowances</TableHead>
                    <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Deductions</TableHead>
                    <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Net Due</TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRecords.map((rec) => (
                    <TableRow key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8 py-4 font-black text-slate-800 text-xs uppercase">{rec.month} {rec.year}</TableCell>
                      <TableCell className="text-right font-bold text-slate-600 text-xs">{fmtGNF(rec.baseSalary)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 text-xs">+ {fmtGNF(rec.allowances)}</TableCell>
                      <TableCell className="text-right font-bold text-rose-500 text-xs">− {fmtGNF(rec.deductions)}</TableCell>
                      <TableCell className="text-right font-black text-slate-900 text-xs">{fmtGNF(rec.netSalary)}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={rec.status} />
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadPayslip(rec)}
                          className="rounded-xl hover:bg-slate-100 text-blue-600 font-bold text-xs gap-1 cursor-pointer"
                        >
                          <Download size={14} /> Payslip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Disbursements Table */}
        <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
          <CardHeader className="px-8 py-5 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Disbursement History</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Approved banking transactions credited to employee account</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {salaryPayments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold italic text-sm">
                No bank transfers or cash distributions registered.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">Date Issued</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Payment Reference</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Method</TableHead>
                    <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Disbursed Amount</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryPayments.map((pay) => (
                    <TableRow key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8 py-4 text-xs font-bold text-slate-700">
                        {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-400">#{pay.referenceNumber || pay.id}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{pay.paymentMethod || 'Bank Transfer'}</TableCell>
                      <TableCell className="text-right font-black text-emerald-600 text-xs">{fmtGNF(pay.amount)} GNF</TableCell>
                      <TableCell className="pr-8 text-right">
                        <StatusBadge status={pay.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
