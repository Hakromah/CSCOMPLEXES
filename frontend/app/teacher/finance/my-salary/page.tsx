'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, DollarSign, Download, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { generatePayslip, PayslipData } from '@/lib/pdf-generator';

interface SalaryRecord {
  id: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  status: string;
  currency?: string;
}

export default function TeacherSalaryPage() {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('Faculty Member');

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        const [salaryRes, userRes] = await Promise.all([
          api.get('/teacher/finance/my-salary'),
          api.get('/auth/me')
        ]);
        setSalaryRecords(Array.isArray(salaryRes.data) ? salaryRes.data : []);
        setTeacherName(userRes.data?.name || userRes.data?.username || 'Faculty Member');
      } catch (error) {
        toast.error('Failed to sync payroll data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalaryData();
  }, []);

  const downloadPayslip = (rec: SalaryRecord) => {
    try {
      const payslipData: PayslipData = {
        employeeName: teacherName,
        role: 'Faculty Teacher',
        month: rec.month,
        year: rec.year,
        baseSalary: Number(rec.baseSalary),
        allowances: Number(rec.allowances),
        deductions: Number(rec.deductions),
        netSalary: Number(rec.netSalary),
        paymentDate: rec.paymentDate || '—',
        paymentMethod: rec.paymentMethod || 'Bank Transfer',
        currency: rec.currency || 'GNF',
      };
      const doc = generatePayslip(payslipData);
      doc.save(`payslip-${rec.month.toLowerCase()}-${rec.year}.pdf`);
      toast.success('Payslip PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Payroll Data...</p>
      </div>
    );
  }

  const latestRecord = salaryRecords[0] || null;
  const currency = latestRecord?.currency || 'GNF';

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <DollarSign size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Payroll Access</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
          My <span className="text-primary">Salary.</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
          View your base salary, allowances, deductions, and download payslips
        </p>
      </header>

      {/* Latest Payslip Overview */}
      {latestRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white p-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Period</span>
            <h3 className="text-xl font-black text-slate-900 mt-1 uppercase">
              {latestRecord.month} {latestRecord.year}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2">Latest processed salary cycle</p>
          </Card>

          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white p-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Salary</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {currency} {latestRecord.baseSalary.toLocaleString()}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2">Contracted salary rate</p>
          </Card>

          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white p-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Net Paid</span>
            <h3 className="text-xl font-black text-emerald-700 mt-1">
              {currency} {latestRecord.netSalary.toLocaleString()}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2">Paid amount after adjustments</p>
          </Card>

          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-slate-900 text-white p-6 flex flex-col justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
              <div className="flex items-center gap-1 text-emerald-400 font-black text-sm uppercase mt-1">
                <CheckCircle2 size={16} /> {latestRecord.status}
              </div>
            </div>
            <Button
              onClick={() => downloadPayslip(latestRecord)}
              size="sm"
              className="bg-white text-slate-900 hover:bg-primary hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest h-9 px-4 cursor-pointer"
            >
              <Download size={12} className="mr-1" /> PDF Payslip
            </Button>
          </Card>
        </div>
      )}

      {/* Salary Records List */}
      <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-row items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" /> Payslip Directory
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {salaryRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs">
              No salary logs found for your profile.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Pay Period</TableHead>
                  <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Payment Date</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Base Salary</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Allowances</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Deductions</TableHead>
                  <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Net Salary</TableHead>
                  <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryRecords.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-8 font-black text-slate-800 text-xs uppercase">{rec.month} {rec.year}</TableCell>
                    <TableCell className="text-slate-500 font-medium text-xs">
                      {rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-700 text-xs">
                      {currency} {rec.baseSalary.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 text-xs">
                      + {rec.allowances.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600 text-xs">
                      - {rec.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-black text-slate-900 text-xs">
                      {currency} {rec.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`uppercase text-[9px] font-black border-none rounded-full px-2.5 py-0.5 ${
                        rec.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadPayslip(rec)}
                        className="rounded-xl text-primary hover:bg-slate-50 gap-1 text-[10px] font-black uppercase cursor-pointer"
                      >
                        <Download size={12} /> Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
