/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Filter, X, GraduationCap,
} from 'lucide-react';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AttendanceRecord {
  id: number;
  sessionId?: number | null;
  date: string;
  sessionTime: string | null;
  createdAt?: string | null;
  classId?: number | null;
  className: string;
  subjectId?: number | null;
  subjectName: string | null;
  subjectCode?: string | null;
  notes: string | null;
  status: string;
}

type AStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

interface AbsenceOccurrence {
  id: number;
  date: string;
  time: string;
  className: string;
  courseName: string;
  status: AStatus;
  notes?: string | null;
}

interface CourseAbsenceSummary {
  courseName: string;
  className: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  rate: number;
  absences: AbsenceOccurrence[];
}

const EXPULSION_THRESHOLD = 3;

const STATUS_DISPLAY: Record<AStatus, { label: string; icon: any; bg: string; text: string; border: string }> = {
  PRESENT: { label: 'Présent',  icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ABSENT:  { label: 'Absent',   icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
  LATE:    { label: 'Retard',   icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  EXCUSED: { label: 'Justifié', icon: ShieldAlert,  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  SICK:    { label: 'Malade',   icon: ShieldAlert,  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200'  },
};

const resolveStatus = (status: string): AStatus => {
  if (['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'].includes(status)) return status as AStatus;
  return 'ABSENT';
};

function formatSessionTime(sessionTime?: string | null, createdAt?: string | null): string {
  if (sessionTime) {
    try {
      const d = new Date(`2000-01-01T${sessionTime}`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      return sessionTime;
    } catch {
      return sessionTime;
    }
  }
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      // ignore
    }
  }
  return 'Heure non spécifiée';
}

function formatDateFr(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const MONTHS = [
  { value: '0', label: 'Janvier' }, { value: '1', label: 'Février' },
  { value: '2', label: 'Mars' }, { value: '3', label: 'Avril' },
  { value: '4', label: 'Mai' }, { value: '5', label: 'Juin' },
  { value: '6', label: 'Juillet' }, { value: '7', label: 'Août' },
  { value: '8', label: 'Septembre' }, { value: '9', label: 'Octobre' },
  { value: '10', label: 'Novembre' }, { value: '11', label: 'Décembre' },
];

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

// ── Portal Course Absence Hover Card for Student ────────────────────────────
function StudentCourseAbsenceCard({ summary }: { summary: CourseAbsenceSummary }) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeBelow: boolean }>({
    top: 0,
    left: 0,
    placeBelow: false,
  });

  const count = summary.absentCount;
  const isCritical = count >= EXPULSION_THRESHOLD;
  const isWarning = count === EXPULSION_THRESHOLD - 1;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 320;
    const estimatedHeight = 250;
    const placeBelow = rect.top < estimatedHeight + 20;
    const rawLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    const clampedLeft = Math.max(12, Math.min(rawLeft, window.innerWidth - popoverWidth - 12));
    const top = placeBelow ? rect.bottom + 8 : rect.top - 8;
    setCoords({ top, left: clampedLeft, placeBelow });
  }, []);

  const handleOpen = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePosition();
    setHovered(true);
  }, [updatePosition]);

  const handleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, 120);
  }, []);

  useEffect(() => {
    if (!hovered) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovered, updatePosition]);

  return (
    <div
      ref={triggerRef}
      className={`relative rounded-2xl border p-4 bg-white shadow-sm transition-all duration-200 cursor-pointer ${
        isCritical
          ? 'border-rose-300 bg-rose-50/30 hover:shadow-md'
          : isWarning
          ? 'border-amber-300 bg-amber-50/20 hover:shadow-md'
          : 'border-slate-100 hover:border-primary/40 hover:shadow-md'
      }`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onClick={() => (hovered ? setHovered(false) : handleOpen())}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {summary.className || 'Cours'}
          </span>
          <h4 className="text-sm font-black text-slate-900 leading-snug">{summary.courseName}</h4>
        </div>
        <Badge
          className={`border-none font-black text-[10px] uppercase px-2.5 py-1 ${
            isCritical
              ? 'bg-rose-600 text-white animate-pulse'
              : isWarning
              ? 'bg-amber-500 text-white'
              : count > 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {count} Absence{count !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-slate-500">
            Seuil d&apos;exclusion : {count} / {EXPULSION_THRESHOLD}
          </span>
          <span className={summary.rate >= 75 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
            {summary.rate}% présence
          </span>
        </div>
        <Progress
          value={Math.min(100, Math.round((count / EXPULSION_THRESHOLD) * 100))}
          className="h-1.5 bg-slate-100"
        />
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1">
          <span>{summary.totalSessions} séance(s)</span>
          <span className="text-primary underline decoration-dotted">Survoler pour dates & heures</span>
        </div>
      </div>

      {hovered &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: coords.placeBelow ? 'none' : 'translateY(-100%)',
              zIndex: 9999,
            }}
            className="w-80 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                  Détails de mes absences
                </p>
                <h5 className="text-xs font-black text-white mt-0.5">{summary.courseName}</h5>
              </div>
              <Badge className="bg-rose-600 text-white border-none font-black text-[9px]">
                {count} Absence{count !== 1 ? 's' : ''}
              </Badge>
            </div>

            {isCritical && (
              <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-700/70 rounded-xl px-3 py-2 mb-2.5">
                <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                <p className="text-[10px] font-bold text-rose-200 leading-tight">
                  Attention : Vous avez manqué ce cours {count} fois (seuil d&apos;exclusion : {EXPULSION_THRESHOLD} absences).
                </p>
              </div>
            )}

            {summary.absences.length === 0 ? (
              <p className="text-[11px] text-emerald-400 font-bold text-center py-2">
                ✓ Aucune absence enregistrée dans ce cours !
              </p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Dates & Heures de chaque absence
                </p>
                {summary.absences.map((ab, idx) => (
                  <div
                    key={`${ab.id}-${idx}`}
                    className="flex items-center justify-between bg-slate-800/90 rounded-xl px-3 py-2 text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-black flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      <span className="font-black text-white">{formatDateFr(ab.date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                      <Clock size={10} className="text-rose-400" />
                      <span>{ab.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

// ── PDF generation ────────────────────────────────────────────────────────────
const downloadAttendancePDF = (records: AttendanceRecord[], stats: any, studentName: string) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('2CS COMPLEXE SCOLAIRE CAMARA SALEMATOU', 14, 12);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Rapport de présence officiel  •  Suivi des absences par cours', 14, 19);
    doc.text(`Généré le: ${date}`, 14, 25);

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageW - 66, 8, 52, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(studentName.toUpperCase(), pageW - 40, 17, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 210, 255);
    doc.text('Étudiant', pageW - 40, 23, { align: 'center' });

    autoTable(doc, {
      startY: 46,
      head: [['#', 'Date', 'Heure', 'Classe', 'Matière / Cours', 'Statut']],
      body: records.map((r, i) => [
        String(i + 1),
        formatDateFr(r.date),
        formatSessionTime(r.sessionTime, r.createdAt),
        r.className || 'N/A',
        r.notes || r.subjectName || 'Séance générale',
        resolveStatus(r.status),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] as any, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] as any },
    });

    doc.save(`Presence_${studentName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
    toast.success('Rapport de présence téléchargé !');
  } catch (err) {
    console.error('Erreur de génération PDF:', err);
    toast.error('Échec de la génération du rapport PDF.');
  }
};

// ══════════════════════════════════════════════════════════════════════════════
export default function StudentAttendancePage() {
  const [records, setRecords]         = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter]   = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [studentName, setStudentName] = useState('Étudiant');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [attRes, profileRes] = await Promise.allSettled([
          api.get('/student/attendance'),
          api.get('/student/profile'),
        ]);

        if (attRes.status === 'fulfilled') {
          const data = attRes.value.data;
          setRecords(Array.isArray(data) ? data : []);
        } else {
          toast.error('Échec du chargement des relevés de présence.');
        }

        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value.data;
          setStudentName(p?.name || p?.username || 'Étudiant');
        }
      } catch (err: any) {
        toast.error('Échec de la synchronisation du registre.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Unique Classes & Subjects for Filters ───────────────────────────────────
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.className) set.add(r.className);
    });
    return Array.from(set).sort();
  }, [records]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const name = r.notes || r.subjectName || 'Séance générale';
      set.add(name);
    });
    return Array.from(set).sort();
  }, [records]);

  // ── Cumulative Per-Course Absence Breakdown (across all records) ────────────
  const courseSummaries = useMemo(() => {
    const map = new Map<string, CourseAbsenceSummary>();
    for (const r of records) {
      if (classFilter !== 'all' && r.className !== classFilter) continue;
      const courseName = r.notes || r.subjectName || 'Séance générale';
      if (subjectFilter !== 'all' && courseName !== subjectFilter) continue;

      if (!map.has(courseName)) {
        map.set(courseName, {
          courseName,
          className: r.className || 'N/A',
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          rate: 100,
          absences: [],
        });
      }
      const entry = map.get(courseName)!;
      entry.totalSessions++;
      const st = resolveStatus(r.status);
      if (st === 'PRESENT') entry.presentCount++;
      else if (st === 'ABSENT') {
        entry.absentCount++;
        entry.absences.push({
          id: r.id,
          date: r.date,
          time: formatSessionTime(r.sessionTime, r.createdAt),
          className: r.className || 'N/A',
          courseName,
          status: st,
          notes: r.notes,
        });
      } else if (st === 'LATE') entry.lateCount++;
      else entry.excusedCount++;

      entry.rate =
        entry.totalSessions > 0
          ? Math.round(((entry.presentCount + entry.lateCount) / entry.totalSessions) * 100)
          : 100;
    }
    return Array.from(map.values()).sort((a, b) => b.absentCount - a.absentCount);
  }, [records, classFilter, subjectFilter]);

  // ── Filter Records ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (classFilter !== 'all' && r.className !== classFilter) return false;
      const courseName = r.notes || r.subjectName || 'Séance générale';
      if (subjectFilter !== 'all' && courseName !== subjectFilter) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      if (monthFilter !== 'all') {
        if (!r.date || new Date(r.date).getMonth().toString() !== monthFilter) return false;
      }
      if (statusFilter !== 'all' && resolveStatus(r.status) !== statusFilter) return false;
      return true;
    });
  }, [records, classFilter, subjectFilter, dateFilter, monthFilter, statusFilter]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((r) => resolveStatus(r.status) === 'PRESENT').length;
    const absent = filtered.filter((r) => resolveStatus(r.status) === 'ABSENT').length;
    const late = filtered.filter((r) => resolveStatus(r.status) === 'LATE').length;
    const excused = filtered.filter((r) => ['EXCUSED', 'SICK'].includes(resolveStatus(r.status))).length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [filtered]);

  const criticalCourses = courseSummaries.filter((c) => c.absentCount >= EXPULSION_THRESHOLD);

  if (loading) {
    return (
      <div className="h-[80vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Synchronisation du registre en cours...
        </p>
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Présence & Suivi par Cours</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.8rem)] font-black tracking-tighter text-slate-900 italic">
            Mon <span className="text-primary">Registre.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
            {studentName} • Suivi des absences par matière, date et heure
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            className="h-11 rounded-2xl gap-2 font-bold text-sm border-slate-200 hover:border-primary transition-colors cursor-pointer"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Imprimer
          </Button>

          <Button
            className="h-11 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-primary transition-colors cursor-pointer"
            onClick={() => downloadAttendancePDF(filtered, stats, studentName)}
            disabled={filtered.length === 0}
          >
            <Download size={14} /> Télécharger le PDF
          </Button>
        </div>
      </header>

      {/* ── Critical Course Expulsion Warning ── */}
      {criticalCourses.length > 0 && (
        <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 rounded-2xl px-6 py-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div>
            <p className="font-black text-rose-700 text-sm">
              Alerte Seuil d&apos;Absences par Cours ({EXPULSION_THRESHOLD}+ absences)
            </p>
            <p className="text-rose-600 text-xs font-bold mt-0.5">
              Vous avez atteint ou dépassé {EXPULSION_THRESHOLD} absences dans :{' '}
              <strong>{criticalCourses.map((c) => `${c.courseName} (${c.absentCount})`).join(', ')}</strong>. Veuillez contacter votre enseignant.
            </p>
          </div>
        </div>
      )}

      {/* ── Filter Bar: Class, Subject, Date, Month, Status ── */}
      <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
              Filtrer mes présences par Classe, Matière, Date et Mois
            </h3>
          </div>
          {(classFilter !== 'all' || subjectFilter !== 'all' || dateFilter || monthFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClassFilter('all');
                setSubjectFilter('all');
                setDateFilter('');
                setMonthFilter('all');
                setStatusFilter('all');
              }}
              className="text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-8 rounded-xl cursor-pointer"
            >
              <X size={12} className="mr-1" /> Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Class */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Classe</label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Toutes les classes</SelectItem>
                {uniqueClasses.map((c) => (
                  <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Matière / Cours</label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Toutes les matières" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Toutes les matières</SelectItem>
                {uniqueSubjects.map((s) => (
                  <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date exacte</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent outline-none w-full"
              />
              {dateFilter && (
                <button type="button" onClick={() => setDateFilter('')} className="text-slate-400 hover:text-rose-500">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Month */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mois</label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Tous les mois" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Tous les mois</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="font-bold">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Tous les statuts</SelectItem>
                <SelectItem value="ABSENT" className="font-bold text-rose-600">Absent uniquement</SelectItem>
                <SelectItem value="LATE" className="font-bold text-amber-600">Retard uniquement</SelectItem>
                <SelectItem value="PRESENT" className="font-bold text-emerald-600">Présent uniquement</SelectItem>
                <SelectItem value="EXCUSED" className="font-bold text-blue-600">Justifié uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Per-Course Absence Tracker (Hover to see Dates & Times) ── */}
      <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-visible">
        <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <GraduationCap size={16} className="text-primary" />
              Mes Absences par Matière (Survoler un cours pour voir la Date & l&apos;Heure de chaque absence)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Suivez le nombre exact de séances manquées dans chaque cours (seuil critique : {EXPULSION_THRESHOLD} absences).
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {courseSummaries.length === 0 ? (
            <p className="text-center text-xs font-bold text-slate-400 py-6">
              Aucune donnée de cours enregistrée pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {courseSummaries.map((cs) => (
                <StudentCourseAbsenceCard key={cs.courseName} summary={cs} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="col-span-2 bg-slate-900 text-white border-none shadow-xl rounded-3xl overflow-hidden relative p-0">
          <CardContent className="p-8 relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Taux de présence</p>
                <h2 className={`text-7xl font-black italic tracking-tighter mt-1 ${stats.rate >= 75 ? 'text-white' : 'text-rose-400'}`}>
                  {stats.rate}%
                </h2>
              </div>
              <Badge className="bg-primary/20 text-blue-400 border-none font-black px-4 py-1 uppercase text-[9px] mt-1">
                {stats.rate >= 75 ? 'En règle' : 'À surveiller'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Suivi des présences</span>
                <span className={stats.rate >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                  {stats.present + stats.late} / {stats.total} Séances
                </span>
              </div>
              <Progress value={stats.rate} className="h-2.5 bg-white/10" />
            </div>
          </CardContent>
          <TrendingUp size={200} className="absolute -right-14 -bottom-12 text-white/5" />
        </Card>

        <StatCard
          label="Séances Présentes"
          value={stats.present}
          icon={CheckCircle2}
          colorClass="border-emerald-100 hover:border-emerald-300"
          sub={stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}% des séances` : '—'}
        />
        <StatCard
          label="Séances Absentes"
          value={stats.absent}
          icon={XCircle}
          colorClass="border-rose-100 hover:border-rose-300"
          sub={stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}% des séances` : '—'}
        />
        <StatCard
          label="Retards"
          value={stats.late}
          icon={Clock}
          colorClass="border-amber-100 hover:border-amber-300"
          sub="Présence tardive"
        />
        <StatCard
          label="Justifié / Malade"
          value={stats.excused}
          icon={ShieldAlert}
          colorClass="border-blue-100 hover:border-blue-300"
          sub="Avec justificatif"
        />
      </div>

      {/* ── Attendance History Table ── */}
      <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-900">Historique Détaillé des Séances</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {filtered.length} séance{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <BookOpen size={16} className="text-slate-200" />
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">Date & Heure</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Matière / Cours</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Classe</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Cumul Absences Cours</TableHead>
                <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((record) => {
                  const status = resolveStatus(record.status);
                  const cfg = STATUS_DISPLAY[status];
                  const Icon = cfg.icon;
                  const courseName = record.notes || record.subjectName || 'Séance générale';
                  const courseSum = courseSummaries.find((c) => c.courseName === courseName);

                  return (
                    <TableRow key={record.id} className="border-slate-50 hover:bg-slate-50/60 transition-all duration-200">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                            <Calendar size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-black text-slate-700 text-sm">{formatDateFr(record.date)}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={10} className="text-primary" />
                              {formatSessionTime(record.sessionTime, record.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-primary text-sm">{courseName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-slate-900 text-sm">{record.className || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-none font-black text-[10px] ${
                            (courseSum?.absentCount || 0) >= EXPULSION_THRESHOLD
                              ? 'bg-rose-600 text-white'
                              : (courseSum?.absentCount || 0) > 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {courseSum?.absentCount || 0} absence(s) dans ce cours
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-[10px] uppercase tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Calendar size={40} className="text-slate-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Aucune séance ne correspond aux filtres sélectionnés.
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
