/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Calendar, CheckCircle2, XCircle, Clock, Users, Loader2,
  ClipboardList, BarChart2, Trash2, ShieldAlert, TrendingUp, RefreshCw, BookOpen, FileEdit, X, Download
} from 'lucide-react';
import api from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SCHOOL_CONFIG } from '@/lib/school-config';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AttendanceSession {
  id: number;
  date: string;
  sessionTime: string | null;
  subjectName: string | null;
  notes: string | null;
  className: string;
  classId: number;
  totalCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
  records: { studentId: number; studentName: string; userId: string; status: string }[];
}

interface Analytics {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  overallRate: number;
  byClass: { name: string; total: number; present: number; late: number; rate: number }[];
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Présent'  },
  ABSENT:  { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Absent'   },
  LATE:    { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Retard'   },
  EXCUSED: { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Justifié' },
  SICK:    { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Malade'   },
};

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <Icon size={15} className="text-slate-300" />
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminAttendancePage() {
  const [sessions, setSessions]   = useState<AttendanceSession[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [classes, setClasses]     = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dateFilter, setDateFilter]   = useState<string>('');   // ISO date string YYYY-MM-DD
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'sessions' | 'analytics'>('analytics');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, analyticsRes, classesRes] = await Promise.all([
        api.get('/admin/attendance'),
        api.get('/admin/attendance/analytics'),
        api.get('/admin/classes'),
      ]);
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setAnalytics(analyticsRes.data);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (err: any) {
      toast.error('Échec du chargement des données de présence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Filter sessions by class + date ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const matchClass = classFilter === 'all' || String(s.classId) === classFilter;
      const matchDate  = !dateFilter || s.date === dateFilter;
      return matchClass && matchDate;
    });
  }, [sessions, classFilter, dateFilter]);

  // ── Delete session ───────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette session? Tous les enregistrements des étudiants pour cette session seront également supprimés.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/attendance/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session supprimée');
    } catch {
      toast.error('Échec de la suppression de la session');
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    if (!sessions || sessions.length === 0) {
      toast.error('Aucune session à exporter');
      return;
    }
    const headers = ['ID Session', 'Date', 'Classe', 'Matière', 'Heure de la session', 'Total Présents', 'Total Absents', 'Total Retards', 'Taux de Présence (%)'];
    const rows = sessions.map(s => [
      s.id,
      s.date,
      s.className,
      s.subjectName || '—',
      s.sessionTime || '—',
      s.presentCount,
      s.absentCount,
      s.lateCount,
      `${s.attendanceRate}%`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `presence_ecole_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exporté avec succès');
  };

  const exportPDF = () => {
    if (!analytics) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageW, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(SCHOOL_CONFIG.name, 15, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(SCHOOL_CONFIG.address || '', 15, 22);
      doc.text(`Contact: ${SCHOOL_CONFIG.contact || ''}`, 15, 28);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RAPPORT DE PRÉSENCE GLOBAL', pageW - 15, 16, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageW - 15, 22, { align: 'right' });

      // Blue divider
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 40, pageW, 1.5, 'F');

      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Résumé des statistiques de présence', 15, 55);

      // Info box with stats
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 62, pageW - 30, 25, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 62, pageW - 30, 25, 3, 3, 'S');

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('TAUX GLOBAL', 20, 70);
      doc.text('TOTAL ENREGISTREMENTS', 65, 70);
      doc.text('PRÉSENTS / ABSENTS', 120, 70);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`${analytics.overallRate}%`, 20, 78);
      doc.text(`${analytics.totalRecords}`, 65, 78);
      doc.text(`${analytics.presentCount} / ${analytics.absentCount}`, 120, 78);

      // Class Rates Table
      autoTable(doc, {
        startY: 95,
        head: [['Classe', 'Total Vérifié', 'Présents', 'En retard', 'Taux de présence']],
        body: analytics.byClass.map(c => [
          c.name,
          c.total,
          c.present,
          c.late,
          `${c.rate}%`
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${SCHOOL_CONFIG.name} — Document Interne Confidentiel`, pageW / 2, pageH - 5, { align: 'center' });

      doc.save(`rapport-presence-ecole-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport de présence PDF exporté avec succès');
    } catch (e) {
      console.error(e);
      toast.error("Échec de l'exportation PDF");
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement des données de présence...</p>
      </div>
    );
  }

  const attendanceRatioData = analytics ? [
    { name: 'Présents', value: analytics.presentCount, color: '#10b981' },
    { name: 'Absents', value: analytics.absentCount, color: '#f43f5e' },
    { name: 'En retard', value: analytics.lateCount, color: '#f59e0b' },
    { name: 'Justifiés', value: analytics.excusedCount, color: '#3b82f6' },
  ] : [];

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-6 bg-[#f8fafc]">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Admin</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.5rem)] font-black tracking-tighter text-slate-900 italic">
            Présence <span className="text-primary">Control.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
            Visibilité et gestion de la présence à l'échelle de l'école
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-2xl gap-2 font-bold text-sm border-slate-200 hover:border-primary cursor-pointer"
            onClick={exportCSV}
          >
            <Download size={14} /> Exporter CSV
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-2xl gap-2 font-bold text-sm border-slate-200 hover:border-primary cursor-pointer"
            onClick={exportPDF}
          >
            <Download size={14} /> Exporter PDF
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-2xl gap-2 font-bold text-sm border-slate-200 hover:border-primary cursor-pointer"
            onClick={fetchData}
          >
            <RefreshCw size={14} /> Actualiser
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3">
        <Button
          onClick={() => setTab('analytics')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <BarChart2 size={13} /> Analytics
        </Button>
        <Button
          onClick={() => setTab('sessions')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'sessions' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <ClipboardList size={13} /> Toutes les sessions
        </Button>
      </div>

      {/* ═══ ANALYTICS TAB ══════════════════════════════════════════════════ */}
      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Big overview card */}
          <Card className="bg-slate-900 text-white border-none shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Taux de présence global</p>
                  <h2 className={`text-7xl font-black italic tracking-tighter mt-1 ${analytics.overallRate >= 75 ? 'text-white' : 'text-rose-400'}`}>
                    {analytics.overallRate}%
                  </h2>
                </div>
                <Badge className="bg-primary/20 text-blue-400 border-none font-black px-4 py-1 uppercase text-[9px]">
                  {analytics.totalRecords} Données totales
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Présence globale</span>
                  <span className={analytics.overallRate >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                    {analytics.presentCount + analytics.lateCount} / {analytics.totalRecords} Présents
                  </span>
                </div>
                <Progress value={analytics.overallRate} className="h-2.5 bg-white/10" />
              </div>
              <TrendingUp size={180} className="absolute -right-10 -bottom-10 text-white/5" />
            </CardContent>
          </Card>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Présents"       value={analytics.presentCount}  icon={CheckCircle2} color="border-emerald-100 hover:border-emerald-300" />
            <StatCard label="Absents"        value={analytics.absentCount}   icon={XCircle}      color="border-rose-100 hover:border-rose-300"     />
            <StatCard label="En retard"      value={analytics.lateCount}     icon={Clock}        color="border-amber-100 hover:border-amber-300"    />
            <StatCard label="Excusés/Malades" value={analytics.excusedCount}  icon={ShieldAlert}  color="border-blue-100 hover:border-blue-300"     />
          </div>

          {/* Recharts Analytics Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Répartition des présences</h3>
                <p className="text-[10px] font-bold text-slate-400">Détail du statut de tous les enregistrements de présence</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={attendanceRatioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceRatioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Enregistrements']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Comparaison par classe</h3>
                <p className="text-[10px] font-bold text-slate-400">Taux moyen de présence pour chaque classe active</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={analytics.byClass} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Taux de présence']} />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {analytics.byClass.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rate >= 75 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per-class breakdown */}
          {analytics.byClass.length > 0 && (
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="border-b border-slate-50 px-8 py-5">
                <p className="font-black text-xs uppercase tracking-widest text-slate-900">Présence par classe</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Classe</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Total</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Présents</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Retards</TableHead>
                      <TableHead className="pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Taux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.byClass.map(cls => (
                      <TableRow key={cls.name} className="border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="pl-8 py-4 font-black text-slate-800">{cls.name}</TableCell>
                        <TableCell className="text-center font-bold text-slate-600">{cls.total}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-emerald-700 font-black">{cls.present}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-amber-700 font-black">{cls.late}</span>
                        </TableCell>
                        <TableCell className="pr-8">
                          <div className="flex items-center gap-3">
                            <Progress value={cls.rate} className="h-2 flex-1 bg-slate-100" />
                            <span className={`text-xs font-black min-w-[36px] ${cls.rate >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {cls.rate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ SESSIONS TAB ════════════════════════════════════════════════════ */}
      {tab === 'sessions' && (
        <div className="space-y-5">
          {/* Filters row: Class + Date + result count */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Class filter */}
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[200px] h-11 rounded-2xl bg-white border-slate-100 font-bold shadow-sm hover:border-primary transition-colors">
                <SelectValue placeholder="Filtrer par classe" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all" className="font-bold">Toutes les classes</SelectItem>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)} className="font-bold">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 h-11 shadow-sm hover:border-primary transition-colors">
              <Calendar size={14} className="text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="text-sm font-bold text-slate-700 bg-transparent outline-none w-[140px]"
                placeholder="Filtrer par date"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-slate-300 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                  title="Supprimer le filtre date"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Clear all */}
            {(classFilter !== 'all' || dateFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11 rounded-2xl font-bold text-[11px] text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-4 cursor-pointer"
                onClick={() => { setClassFilter('all'); setDateFilter(''); }}
              >
                <X size={12} className="mr-1" /> Supprimer les filtres
              </Button>
            )}

            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-auto">
              {filtered.length} session{filtered.length !== 1 ? 's' : ''} trouvées
            </p>
          </div>

          {/* Sessions list */}
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
              <Users size={40} className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">
                {dateFilter || classFilter !== 'all' ? 'Aucune session ne correspond à vos filtres.' : 'Aucune session trouvée.'}
              </p>
            </div>
          ) : (
            <div
              className="space-y-2 overflow-y-auto pr-1"
              style={{ maxHeight: '420px' }}
            >
              {filtered.map(session => {
                const isExpanded = expandedId === session.id;
                return (
                  <Card key={session.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Session row */}
                    <div
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                          <Calendar size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">
                            {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{session.className}</span>
                            {session.notes ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                                <FileEdit size={8} /> {session.notes}
                              </span>
                            ) : session.subjectName ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                                <BookOpen size={8} /> {session.subjectName}
                              </span>
                            ) : null}
                            {session.sessionTime && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                                <Clock size={8} />
                                {new Date(`2000-01-01T${session.sessionTime}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex gap-4">
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />{session.presentCount} Présents
                          </span>
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />{session.absentCount} Absents
                          </span>
                          {session.lateCount > 0 && (
                            <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />{session.lateCount} Retards
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-black px-3 py-1 rounded-full ${session.attendanceRate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {session.attendanceRate}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 cursor-pointer"
                          onClick={e => { e.stopPropagation(); handleDelete(session.id); }}
                          disabled={deleting === session.id}
                        >
                          {deleting === session.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: per-student records */}
                    {isExpanded && session.records.length > 0 && (
                      <div className="border-t border-slate-50 bg-slate-50/30">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Étudiant</TableHead>
                              <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">ID</TableHead>
                              <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.records.map((rec, i) => {
                              const style = STATUS_STYLE[rec.status] || STATUS_STYLE['ABSENT'];
                              return (
                                <TableRow key={i} className="border-slate-50 hover:bg-white/60">
                                  <TableCell className="pl-8 py-3 font-bold text-slate-800 text-sm capitalize">
                                    {rec.studentName || 'Inconnu'}
                                  </TableCell>
                                  <TableCell className="font-mono text-[10px] text-slate-400">
                                    {rec.userId || rec.studentId}
                                  </TableCell>
                                  <TableCell className="pr-8 text-right">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${style.bg} ${style.text}`}>
                                      {style.label}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
