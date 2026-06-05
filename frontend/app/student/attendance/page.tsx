/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Calendar, CheckCircle2, XCircle, Clock, ShieldAlert, Loader2,
  Download, Printer, TrendingUp, BookOpen, AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ─────────────────────────────────────────────────────────────────────
// Backend getAttendanceByStudent returns flat objects:
// { id, date, className, status }
interface AttendanceRecord {
  id: number;
  date: string;
  sessionTime: string | null;
  className: string;
  subjectName: string | null;
  notes: string | null;
  status: string;
}

type AStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

const STATUS_DISPLAY: Record<AStatus, { label: string; icon: any; bg: string; text: string; border: string }> = {
  PRESENT: { label: 'Present',  icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ABSENT:  { label: 'Absent',   icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
  LATE:    { label: 'Late',     icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  EXCUSED: { label: 'Excused',  icon: ShieldAlert,  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  SICK:    { label: 'Sick',     icon: ShieldAlert,  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200'  },
};

const resolveStatus = (status: string): AStatus => {
  if (['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'].includes(status)) return status as AStatus;
  return 'ABSENT';
};

const MONTHS = [
  { value: '0', label: 'January'  }, { value: '1', label: 'February' },
  { value: '2', label: 'March'    }, { value: '3', label: 'April'    },
  { value: '4', label: 'May'      }, { value: '5', label: 'June'     },
  { value: '6', label: 'July'     }, { value: '7', label: 'August'   },
  { value: '8', label: 'September'}, { value: '9', label: 'October'  },
  { value: '10', label: 'November' }, { value: '11', label: 'December' },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, colorClass, sub }: {
  label: string; value: string | number; icon: any; colorClass: string; sub?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 p-5 rounded-2xl border bg-white shadow-sm transition-colors duration-300 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <Icon size={15} className="text-slate-300" />
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400">{sub}</p>}
    </div>
  );
}

// ── PDF generation ────────────────────────────────────────────────────────────
const downloadAttendancePDF = (records: AttendanceRecord[], stats: any, studentName: string) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();
    const date  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('A.M. FOFANA ISLAMIC & ENGLISH HIGH SCHOOL', 14, 12);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Official Attendance Report  •  Student Registry', 14, 19);
    doc.text(`Generated: ${date}`, 14, 25);

    // Student badge (right side)
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageW - 66, 8, 52, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(studentName.toUpperCase(), pageW - 40, 17, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 210, 255);
    doc.text('Student', pageW - 40, 23, { align: 'center' });

    // Attendance Summary section
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ATTENDANCE SUMMARY', 14, 48);

    // Stat boxes
    const statsY = 53;
    const bw = 37;
    const statItems = [
      { label: 'Total Sessions', value: String(stats.total) },
      { label: 'Present',        value: String(stats.present) },
      { label: 'Absent',         value: String(stats.absent) },
      { label: 'Late',           value: String(stats.late) },
      { label: 'Attendance Rate', value: `${stats.rate}%` },
    ];
    statItems.forEach((item, i) => {
      const x = 14 + i * (bw + 2);
      doc.setFillColor(248, 250, 252);
      doc.rect(x, statsY, bw, 20, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, statsY, bw, 20, 'S');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, x + bw / 2, statsY + 7, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(item.value, x + bw / 2, statsY + 16, { align: 'center' });
    });

    // Detail table
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('DETAILED ATTENDANCE RECORDS', 14, 83);

    autoTable(doc, {
      startY: 87,
      head: [['#', 'Date', 'Time', 'Class', 'Subject', 'Status']],
      body: records.map((r, i) => [
        String(i + 1),
        r.date ? new Date(r.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        r.sessionTime ? new Date(`2000-01-01T${r.sessionTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
        r.className || 'N/A',
        r.subjectName || '—',
        resolveStatus(r.status),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] as any, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] as any },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 33 },
        2: { cellWidth: 18 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 5) {
          const v = data.cell.raw as string;
          if (v === 'PRESENT') data.cell.styles.textColor = [5, 150, 105];
          else if (v === 'ABSENT') data.cell.styles.textColor = [220, 38, 38];
          else if (v === 'LATE') data.cell.styles.textColor = [180, 130, 0];
          else data.cell.styles.textColor = [37, 99, 235];
        }
      },
    });

    // Footer
    const finalY = doc.lastAutoTable?.finalY ?? 240;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, finalY + 15, pageW - 14, finalY + 15);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      'A.M. FOFANA ISLAMIC & ENGLISH HIGH SCHOOL  •  Official Attendance Report  •  Confidential',
      pageW / 2, finalY + 20, { align: 'center' }
    );

    doc.save(`Attendance_${studentName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
    toast.success('Attendance report downloaded!');
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Failed to generate PDF — please try again.');
  }
};

// ══════════════════════════════════════════════════════════════════════════════
export default function StudentAttendancePage() {
  const [records, setRecords]         = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [studentName, setStudentName] = useState('Student');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch both attendance and profile in parallel
        const [attRes, profileRes] = await Promise.allSettled([
          api.get('/student/attendance'),
          api.get('/student/profile'),
        ]);

        if (attRes.status === 'fulfilled') {
          const data = attRes.value.data;
          // Backend returns: [{ id, date, className, status }, ...]
          setRecords(Array.isArray(data) ? data : []);
        } else {
          toast.error('Failed to load attendance records.');
        }

        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value.data;
          setStudentName(p?.name || p?.username || 'Student');
        }
      } catch (err: any) {
        toast.error('Registry sync failed. Please check your connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (monthFilter === 'all') return records;
    return records.filter(r => {
      if (!r.date) return false;
      return new Date(r.date).getMonth().toString() === monthFilter;
    });
  }, [records, monthFilter]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = filtered.length;
    const present = filtered.filter(r => resolveStatus(r.status) === 'PRESENT').length;
    const absent  = filtered.filter(r => resolveStatus(r.status) === 'ABSENT').length;
    const late    = filtered.filter(r => resolveStatus(r.status) === 'LATE').length;
    const excused = filtered.filter(r => ['EXCUSED', 'SICK'].includes(resolveStatus(r.status))).length;
    const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [filtered]);

  const isLowAttendance = stats.total > 5 && stats.rate < 75;

  if (loading) {
    return (
      <div className="h-[80vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Registry...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-6 bg-[#f8fafc]">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Attendance</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.8rem)] font-black tracking-tighter text-slate-900 italic">
            Registry <span className="text-primary">Pulse.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
            {studentName} • Academic Tracking
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[170px] h-11 rounded-2xl bg-white shadow-sm font-bold text-sm border-slate-100 hover:border-primary transition-colors duration-300">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all" className="font-bold">All Months</SelectItem>
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value} className="font-bold">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-11 rounded-2xl gap-2 font-bold text-sm border-slate-200 hover:border-primary transition-colors"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Print
          </Button>

          <Button
            className="h-11 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-primary transition-colors"
            onClick={() => downloadAttendancePDF(filtered, stats, studentName)}
            disabled={filtered.length === 0}
          >
            <Download size={14} /> Download PDF
          </Button>
        </div>
      </header>

      {/* ── Low Attendance Warning ── */}
      {isLowAttendance && (
        <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 rounded-2xl px-6 py-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div>
            <p className="font-black text-rose-700 text-sm">Low Attendance Warning</p>
            <p className="text-rose-500 text-xs font-bold mt-0.5">
              Your attendance rate is <strong>{stats.rate}%</strong> — below the required 75% threshold. Please contact your class teacher.
            </p>
          </div>
          <Badge className="ml-auto bg-rose-600 text-white border-none font-black text-xs px-3 py-1 rounded-xl flex-shrink-0">
            {stats.rate}%
          </Badge>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Big dark rate card — spans 2 cols */}
        <Card className="col-span-2 bg-slate-900 text-white border-none shadow-xl rounded-3xl overflow-hidden relative p-0">
          <CardContent className="p-8 relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Overall Attendance Rate</p>
                <h2 className={`text-7xl font-black italic tracking-tighter mt-1 ${stats.rate >= 75 ? 'text-white' : 'text-rose-400'}`}>
                  {stats.rate}%
                </h2>
              </div>
              <Badge className="bg-primary/20 text-blue-400 border-none font-black px-4 py-1 uppercase text-[9px] mt-1">
                {stats.rate >= 75 ? 'Good Standing' : 'Needs Attention'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Attendance Track</span>
                <span className={stats.rate >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                  {stats.present + stats.late} / {stats.total} Sessions
                </span>
              </div>
              <Progress value={stats.rate} className="h-2.5 bg-white/10" />
            </div>
          </CardContent>
          <TrendingUp size={200} className="absolute -right-14 -bottom-12 text-white/5" />
        </Card>

        <StatCard
          label="Present Days"
          value={stats.present}
          icon={CheckCircle2}
          colorClass="border-emerald-100 hover:border-emerald-300"
          sub={stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}% of sessions` : '—'}
        />
        <StatCard
          label="Absent Days"
          value={stats.absent}
          icon={XCircle}
          colorClass="border-rose-100 hover:border-rose-300"
          sub={stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}% of sessions` : '—'}
        />
        <StatCard
          label="Late Arrivals"
          value={stats.late}
          icon={Clock}
          colorClass="border-amber-100 hover:border-amber-300"
          sub="Counted partially"
        />
        <StatCard
          label="Excused / Sick"
          value={stats.excused}
          icon={ShieldAlert}
          colorClass="border-blue-100 hover:border-blue-300"
          sub="With valid reason"
        />
      </div>

      {/* ── Attendance History Table ── */}
      <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-900">Attendance History</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {filtered.length} session{filtered.length !== 1 ? 's' : ''}
              {monthFilter !== 'all' ? ` in ${MONTHS.find(m => m.value === monthFilter)?.label}` : ' total'}
            </p>
          </div>
          <BookOpen size={16} className="text-slate-200" />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#f1f5f9]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">Date / Time</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Subject</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Class</TableHead>
                <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(record => {
                const status = resolveStatus(record.status);
                const cfg    = STATUS_DISPLAY[status];
                const Icon   = cfg.icon;
                return (
                  <TableRow key={record.id} className="border-slate-50 hover:bg-slate-50/60 transition-all duration-200">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-slate-700 text-sm">
                            {record.date
                              ? new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'N/A'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {record.sessionTime
                              ? new Date(`2000-01-01T${record.sessionTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.notes ? (
                        <div>
                          <p className="font-black text-amber-600 text-sm">{record.notes}</p>
                          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Custom Event</p>
                        </div>
                      ) : record.subjectName ? (
                        <p className="font-black text-primary text-sm">{record.subjectName}</p>
                      ) : (
                        <p className="text-slate-300 italic text-sm font-bold">—</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900 text-sm">{record.className || 'N/A'}</p>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-[10px] uppercase tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <Icon size={11} />
                        {cfg.label}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Calendar size={40} className="text-slate-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {monthFilter !== 'all' ? 'No records for this month.' : 'No attendance records found.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
