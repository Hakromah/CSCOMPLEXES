/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ClipboardList, BarChart2, Trash2, ShieldAlert, TrendingUp,
  RefreshCw, BookOpen, FileEdit, X, Download, AlertTriangle,
  Filter, Search, Eye, GraduationCap,
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
  createdAt?: string | null;
  subjectId?: number | null;
  subjectName: string | null;
  subjectCode?: string | null;
  notes: string | null;
  className: string;
  classId: number;
  totalCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
  records: { id?: number; studentId: number; studentName: string; userId: string; status: string }[];
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

interface AbsenceOccurrence {
  sessionId: number;
  date: string;
  time: string;
  className: string;
  courseName: string;
  status: string;
  notes?: string | null;
}

interface CourseAbsenceSummary {
  courseKey: string;
  courseName: string;
  className: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  absences: AbsenceOccurrence[];
  allRecords: AbsenceOccurrence[];
}

const EXPULSION_THRESHOLD = 3;

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PRESENT: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Présent'  },
  ABSENT:  { bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Absent'   },
  LATE:    { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Retard'   },
  EXCUSED: { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Justifié' },
  SICK:    { bg: 'bg-purple-50 border-purple-200',   text: 'text-purple-700',  dot: 'bg-purple-500',  label: 'Malade'   },
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

// ── Portal Course Absence Hover Badge with Date & Time details ──────────────
function CourseAbsenceHoverBadge({
  summary,
  studentName,
  compact = false,
}: {
  summary: CourseAbsenceSummary;
  studentName: string;
  compact?: boolean;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
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
    const estimatedHeight = 280;
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
    setOpen(true);
  }, [updatePosition]);

  const handleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePosition]);

  const badgeColors = isCritical
    ? 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-200'
    : isWarning
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : count > 0
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div
      ref={triggerRef}
      className="relative inline-block text-left"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${badgeColors}`}
      >
        {isCritical && <AlertTriangle size={11} className="shrink-0 animate-pulse" />}
        {!compact && <span className="truncate max-w-[130px]">{summary.courseName}:</span>}
        <span>{count} absence{count !== 1 ? 's' : ''}</span>
        {isCritical && <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full">Exclusion</span>}
      </button>

      {open &&
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
            className="w-80 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                  Détails des absences ({summary.className})
                </p>
                <h4 className="text-xs font-black text-white mt-0.5">{summary.courseName}</h4>
                <p className="text-[10px] font-bold text-slate-400">{studentName}</p>
              </div>
              <Badge
                className={`border-none font-black text-[9px] uppercase px-2.5 py-0.5 ${
                  isCritical
                    ? 'bg-rose-600 text-white'
                    : isWarning
                    ? 'bg-amber-500 text-slate-950'
                    : count > 0
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {count} / {EXPULSION_THRESHOLD} Absences
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-3 text-center bg-slate-800/70 rounded-xl p-2">
              <div>
                <p className="text-xs font-black text-white">{summary.totalSessions}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">Séances</p>
              </div>
              <div>
                <p className="text-xs font-black text-emerald-400">{summary.presentCount}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">Présent</p>
              </div>
              <div>
                <p className="text-xs font-black text-rose-400">{summary.absentCount}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">Absent</p>
              </div>
              <div>
                <p className="text-xs font-black text-amber-400">{summary.lateCount}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">Retard</p>
              </div>
            </div>

            {isCritical && (
              <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-700/70 rounded-xl px-3 py-2 mb-3">
                <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                <p className="text-[10px] font-bold text-rose-200 leading-tight">
                  Seuil critique atteint : {count} absences soumises par l&apos;enseignant pour ce cours.
                </p>
              </div>
            )}

            {summary.absences.length === 0 ? (
              <p className="text-[11px] text-emerald-400 font-bold text-center py-2">
                ✓ Aucune absence enregistrée pour ce cours
              </p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Dates & Heures de chaque absence
                </p>
                {summary.absences.map((ab, idx) => (
                  <div
                    key={`${ab.sessionId}-${idx}`}
                    className="flex items-center justify-between bg-slate-800/90 rounded-xl px-3 py-2 text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-black flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-black text-white">{formatDateFr(ab.date)}</p>
                        <p className="text-[9px] text-slate-400">{ab.className}</p>
                      </div>
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

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminAttendancePage() {
  const [sessions, setSessions]       = useState<AttendanceSession[]>([]);
  const [analytics, setAnalytics]     = useState<Analytics | null>(null);
  const [classes, setClasses]         = useState<any[]>([]);
  const [subjects, setSubjects]       = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter]   = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<'tracker' | 'sessions' | 'analytics'>('tracker');
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [deleting, setDeleting]       = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, analyticsRes, classesRes, subjectsRes] = await Promise.all([
        api.get('/admin/attendance'),
        api.get('/admin/attendance/analytics'),
        api.get('/admin/classes'),
        api.get('/admin/subjects').catch(() => ({ data: [] })),
      ]);
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setAnalytics(analyticsRes.data);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch (err: any) {
      toast.error('Échec du chargement des données de présence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Extract all unique students & courses across classes and sessions ────────
  const allStudentsList = useMemo(() => {
    const map = new Map<number, { id: number; name: string; userId: string; classIds: Set<number>; className: string }>();

    for (const cls of classes) {
      for (const st of cls.students || []) {
        const name =
          st.firstName && st.lastName
            ? `${st.firstName} ${st.lastName}`.trim()
            : st.username || st.name || `Étudiant #${st.id}`;
        if (!map.has(st.id)) {
          map.set(st.id, {
            id: st.id,
            name,
            userId: st.userId || String(st.id),
            classIds: new Set([cls.id]),
            className: cls.name || 'N/A',
          });
        } else {
          map.get(st.id)!.classIds.add(cls.id);
        }
      }
    }

    for (const s of sessions) {
      for (const r of s.records || []) {
        if (!r.studentId) continue;
        if (!map.has(r.studentId)) {
          map.set(r.studentId, {
            id: r.studentId,
            name: r.studentName || `Étudiant #${r.studentId}`,
            userId: r.userId || String(r.studentId),
            classIds: new Set(s.classId ? [s.classId] : []),
            className: s.className || 'N/A',
          });
        } else if (s.classId) {
          map.get(r.studentId)!.classIds.add(s.classId);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, sessions]);

  const studentsForDropdown = useMemo(() => {
    if (classFilter === 'all') return allStudentsList;
    return allStudentsList.filter((s) => s.classIds.has(Number(classFilter)));
  }, [allStudentsList, classFilter]);

  const allCourseNames = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => {
      if (s?.name) set.add(s.name);
    });
    sessions.forEach((s) => {
      const name = s.notes || s.subjectName || 'Séance générale';
      set.add(name);
    });
    return Array.from(set).sort();
  }, [subjects, sessions]);

  // ── Compute Per-Student, Per-Course Absence Map ─────────────────────────────
  const studentCourseMap = useMemo(() => {
    // Map<studentId, Map<courseKey, CourseAbsenceSummary>>
    const map = new Map<number, Map<string, CourseAbsenceSummary>>();

    for (const session of sessions) {
      if (classFilter !== 'all' && String(session.classId) !== classFilter) continue;
      if (dateFilter && session.date !== dateFilter) continue;

      const courseName = session.notes || session.subjectName || 'Séance générale';
      if (subjectFilter !== 'all' && courseName !== subjectFilter) continue;

      const courseKey = `${session.classId || 0}-${courseName.toLowerCase()}`;
      const time = formatSessionTime(session.sessionTime, session.createdAt);

      for (const rec of session.records || []) {
        if (!rec.studentId) continue;
        if (!map.has(rec.studentId)) {
          map.set(rec.studentId, new Map());
        }
        const stCourses = map.get(rec.studentId)!;
        if (!stCourses.has(courseKey)) {
          stCourses.set(courseKey, {
            courseKey,
            courseName,
            className: session.className || 'N/A',
            totalSessions: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0,
            absences: [],
            allRecords: [],
          });
        }
        const summary = stCourses.get(courseKey)!;
        summary.totalSessions++;
        const st = rec.status || 'ABSENT';
        if (st === 'PRESENT') summary.presentCount++;
        else if (st === 'ABSENT') summary.absentCount++;
        else if (st === 'LATE') summary.lateCount++;
        else summary.excusedCount++;

        const occ: AbsenceOccurrence = {
          sessionId: session.id,
          date: session.date,
          time,
          className: session.className || 'N/A',
          courseName,
          status: st,
          notes: session.notes,
        };
        summary.allRecords.push(occ);
        if (st === 'ABSENT') {
          summary.absences.push(occ);
        }
      }
    }

    return map;
  }, [sessions, classFilter, dateFilter, subjectFilter]);

  // ── Filter Student Rows for Tracker ─────────────────────────────────────────
  const trackerStudentRows = useMemo(() => {
    return studentsForDropdown
      .filter((st) => {
        if (studentFilter !== 'all' && String(st.id) !== studentFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!st.name.toLowerCase().includes(q) && !st.userId.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .map((st) => {
        const courseMap = studentCourseMap.get(st.id);
        const courseSummaries = courseMap ? Array.from(courseMap.values()) : [];
        const totalAbsences = courseSummaries.reduce((acc, c) => acc + c.absentCount, 0);
        const maxCourseAbsences = courseSummaries.reduce((max, c) => Math.max(max, c.absentCount), 0);
        const totalSessions = courseSummaries.reduce((acc, c) => acc + c.totalSessions, 0);
        return {
          student: st,
          courseSummaries,
          totalAbsences,
          maxCourseAbsences,
          totalSessions,
        };
      })
      .filter((row) => {
        if (statusFilter === 'ABSENT') return row.totalAbsences > 0;
        if (dateFilter || subjectFilter !== 'all') return row.totalSessions > 0 || studentFilter !== 'all';
        return true;
      });
  }, [studentsForDropdown, studentFilter, searchQuery, studentCourseMap, statusFilter, dateFilter, subjectFilter]);

  // ── Flat filtered attendance records ────────────────────────────────────────
  const flatFilteredRecords = useMemo(() => {
    const list: {
      sessionId: number;
      date: string;
      time: string;
      classId: number;
      className: string;
      courseName: string;
      studentId: number;
      studentName: string;
      userId: string;
      status: string;
      courseSummary: CourseAbsenceSummary;
    }[] = [];

    for (const session of sessions) {
      if (classFilter !== 'all' && String(session.classId) !== classFilter) continue;
      if (dateFilter && session.date !== dateFilter) continue;
      const courseName = session.notes || session.subjectName || 'Séance générale';
      if (subjectFilter !== 'all' && courseName !== subjectFilter) continue;

      const courseKey = `${session.classId || 0}-${courseName.toLowerCase()}`;
      const time = formatSessionTime(session.sessionTime, session.createdAt);

      for (const rec of session.records || []) {
        if (studentFilter !== 'all' && String(rec.studentId) !== studentFilter) continue;
        if (statusFilter !== 'all' && rec.status !== statusFilter) continue;

        const stInfo = allStudentsList.find((s) => s.id === rec.studentId);
        const studentName = stInfo?.name || rec.studentName || `Étudiant #${rec.studentId}`;
        const userId = stInfo?.userId || rec.userId || String(rec.studentId);

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!studentName.toLowerCase().includes(q) && !userId.toLowerCase().includes(q)) continue;
        }

        const courseSummary = studentCourseMap.get(rec.studentId)?.get(courseKey) || {
          courseKey,
          courseName,
          className: session.className || 'N/A',
          totalSessions: 1,
          presentCount: rec.status === 'PRESENT' ? 1 : 0,
          absentCount: rec.status === 'ABSENT' ? 1 : 0,
          lateCount: rec.status === 'LATE' ? 1 : 0,
          excusedCount: rec.status === 'EXCUSED' || rec.status === 'SICK' ? 1 : 0,
          absences: [],
          allRecords: [],
        };

        list.push({
          sessionId: session.id,
          date: session.date,
          time,
          classId: session.classId,
          className: session.className,
          courseName,
          studentId: rec.studentId,
          studentName,
          userId,
          status: rec.status,
          courseSummary,
        });
      }
    }

    return list;
  }, [sessions, classFilter, dateFilter, subjectFilter, studentFilter, statusFilter, allStudentsList, searchQuery, studentCourseMap]);

  // ── Filter sessions by class + subject + student + date ─────────────────────
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchClass = classFilter === 'all' || String(s.classId) === classFilter;
      const matchDate = !dateFilter || s.date === dateFilter;
      const courseName = s.notes || s.subjectName || 'Séance générale';
      const matchSubj = subjectFilter === 'all' || courseName === subjectFilter;
      const matchStudent =
        studentFilter === 'all' ||
        (s.records || []).some((r) => String(r.studentId) === studentFilter);
      return matchClass && matchDate && matchSubj && matchStudent;
    });
  }, [sessions, classFilter, dateFilter, subjectFilter, studentFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette séance ? Tous les enregistrements associés seront supprimés.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/attendance/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Séance supprimée');
    } catch {
      toast.error('Échec de la suppression de la séance');
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    if (!flatFilteredRecords.length) {
      toast.error('Aucun enregistrement à exporter');
      return;
    }
    const headers = ['Date', 'Heure', 'Classe', 'Matière', 'Étudiant', 'ID Étudiant', 'Statut', 'Total Absences Cours'];
    const rows = flatFilteredRecords.map((r) => [
      r.date,
      r.time,
      r.className,
      r.courseName,
      r.studentName,
      r.userId,
      r.status,
      r.courseSummary.absentCount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `presence_ecole_${new Date().toISOString().split('T')[0]}.csv`);
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

      doc.setFillColor(15, 23, 42);
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
      doc.text('RAPPORT DE PRÉSENCE & ABSENCES PAR COURS', pageW - 15, 16, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageW - 15, 22, { align: 'right' });

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 40, pageW, 1.5, 'F');

      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Heure', 'Classe', 'Matière', 'Étudiant', 'Statut', 'Absences Cours']],
        body: flatFilteredRecords.slice(0, 200).map((r) => [
          r.date,
          r.time,
          r.className,
          r.courseName,
          `${r.studentName} (${r.userId})`,
          STATUS_STYLE[r.status]?.label || r.status,
          `${r.courseSummary.absentCount}`,
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

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
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Chargement des données de présence...
        </p>
      </div>
    );
  }

  const attendanceRatioData = analytics
    ? [
        { name: 'Présents', value: analytics.presentCount, color: '#10b981' },
        { name: 'Absents', value: analytics.absentCount, color: '#f43f5e' },
        { name: 'En retard', value: analytics.lateCount, color: '#f59e0b' },
        { name: 'Justifiés', value: analytics.excusedCount, color: '#3b82f6' },
      ]
    : [];

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-6 bg-[#f8fafc]">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Administration • Contrôle d&apos;Assiduité
            </span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.5rem)] font-black tracking-tighter text-slate-900 italic">
            Présence <span className="text-primary">Control.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
            Suivi par Étudiant, Classe, Date & Matière • Seuil d&apos;exclusion cours : {EXPULSION_THRESHOLD}+ absences
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

      {/* ── Unified 4-Filter Bar: Class, Subject, Student, Date, Status ── */}
      <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
              Vérifier les présences par Étudiant, Classe, Date et Matière
            </h3>
          </div>
          {(classFilter !== 'all' || subjectFilter !== 'all' || studentFilter !== 'all' || dateFilter || statusFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClassFilter('all');
                setSubjectFilter('all');
                setStudentFilter('all');
                setDateFilter('');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-8 rounded-xl cursor-pointer"
            >
              <X size={12} className="mr-1" /> Réinitialiser les filtres
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Class */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Classe</label>
            <Select
              value={classFilter}
              onValueChange={(v) => {
                setClassFilter(v);
                setStudentFilter('all');
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-64">
                <SelectItem value="all" className="font-bold">Toutes les classes</SelectItem>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)} className="font-bold">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Subject */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Matière / Cours</label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Toutes les matières" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-64">
                <SelectItem value="all" className="font-bold">Toutes les matières</SelectItem>
                {allCourseNames.map((name) => (
                  <SelectItem key={name} value={name} className="font-bold">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Student */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Étudiant</label>
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Tous les étudiants" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-64">
                <SelectItem value="all" className="font-bold">
                  Tous les étudiants ({studentsForDropdown.length})
                </SelectItem>
                {studentsForDropdown.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)} className="font-bold">
                    {st.name} ({st.userId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Date */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11">
              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent outline-none w-full"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 5. Status */}
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

          {/* 6. Search */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recherche</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-3.5 text-slate-400" />
              <Input
                placeholder="Nom ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Tabs ── */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => setTab('tracker')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'tracker' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Eye size={13} /> Suivi Absences par Étudiant & Cours
        </Button>
        <Button
          onClick={() => setTab('sessions')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'sessions' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <ClipboardList size={13} /> Toutes les Séances ({filteredSessions.length})
        </Button>
        <Button
          onClick={() => setTab('analytics')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'analytics' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <BarChart2 size={13} /> Analytique Globale
        </Button>
      </div>

      {/* ═══ TAB 1: STUDENT & COURSE ABSENCE TRACKER ═══════════════════════ */}
      {tab === 'tracker' && (
        <div className="space-y-6">
          {/* Student Course Absence Matrix */}
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-visible">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  Cumul d&apos;Absences par Étudiant & par Matière — Survoler pour voir les Dates & Heures
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Les enseignants peuvent exclure un étudiant d&apos;un cours à partir de {EXPULSION_THRESHOLD} absences dans cette matière.
                </p>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-black text-[10px] uppercase px-3 py-1">
                {trackerStudentRows.filter((r) => r.maxCourseAbsences >= EXPULSION_THRESHOLD).length} Étudiant(s) en seuil critique
              </Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                  <TableRow>
                    <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Étudiant
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Classe
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Absences par Cours (Survoler le badge pour voir la date & l&apos;heure de chaque absence)
                    </TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Total Absences
                    </TableHead>
                    <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Statut du Cours
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackerStudentRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-14 text-slate-400 font-bold">
                        Aucun étudiant ne correspond aux filtres sélectionnés.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trackerStudentRows.map(({ student, courseSummaries, totalAbsences, maxCourseAbsences }) => {
                      const isCritical = maxCourseAbsences >= EXPULSION_THRESHOLD;
                      const isWatch = maxCourseAbsences === EXPULSION_THRESHOLD - 1;
                      return (
                        <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/50">
                          <TableCell className="pl-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                                {(student.name[0] || 'E').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{student.name}</p>
                                <p className="font-mono text-[10px] font-bold text-slate-400">#{student.userId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold text-slate-600">
                              {student.className}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            {courseSummaries.length === 0 ? (
                              <span className="text-xs text-slate-400 italic font-medium">Aucune séance enregistrée</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {courseSummaries.map((cs) => (
                                  <CourseAbsenceHoverBadge
                                    key={cs.courseKey}
                                    summary={cs}
                                    studentName={student.name}
                                  />
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-full font-black text-xs ${
                                totalAbsences > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {totalAbsences}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            {isCritical ? (
                              <Badge className="bg-rose-600 text-white border-none font-black text-[9px] uppercase px-3 py-1 gap-1">
                                <AlertTriangle size={11} /> Risque d&apos;exclusion ({maxCourseAbsences} abs.)
                              </Badge>
                            ) : isWatch ? (
                              <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[9px] uppercase px-3 py-1">
                                Attention ({maxCourseAbsences}/{EXPULSION_THRESHOLD})
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] uppercase px-3 py-1">
                                En règle
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Chronological Attendance Log for Selected Filters */}
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-visible">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-row items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Journal Chronologique des Présences ({flatFilteredRecords.length})
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Résultats filtrés par Étudiant, Classe, Date et Matière
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                  <TableRow>
                    <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Date & Heure
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Classe
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Matière / Cours
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Étudiant
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Cumul Absences du Cours (Survoler)
                    </TableHead>
                    <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatFilteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-14 text-slate-400 font-bold">
                        Aucun enregistrement trouvé pour ces critères.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flatFilteredRecords.map((row, idx) => {
                      const style = STATUS_STYLE[row.status] || STATUS_STYLE.ABSENT;
                      return (
                        <TableRow key={`${row.sessionId}-${row.studentId}-${idx}`} className="border-slate-50 hover:bg-slate-50/50">
                          <TableCell className="pl-8 py-3.5">
                            <p className="font-black text-slate-800 text-xs">{formatDateFr(row.date)}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-primary" /> {row.time}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-black text-slate-700">{row.className}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-50 text-blue-700 border-none font-black text-[10px]">
                              {row.courseName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-black text-slate-800 text-xs">{row.studentName}</p>
                            <p className="font-mono text-[10px] text-slate-400">#{row.userId}</p>
                          </TableCell>
                          <TableCell>
                            <CourseAbsenceHoverBadge
                              summary={row.courseSummary}
                              studentName={row.studentName}
                              compact
                            />
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${style.bg} ${style.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {style.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ TAB 2: SESSIONS TAB ═══════════════════════════════════════════ */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
              <Users size={40} className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">
                Aucune séance ne correspond aux filtres sélectionnés.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSessions.map((session) => {
                const isExpanded = expandedId === session.id;
                const courseName = session.notes || session.subjectName || 'Séance générale';
                const courseKey = `${session.classId || 0}-${courseName.toLowerCase()}`;
                const time = formatSessionTime(session.sessionTime, session.createdAt);

                return (
                  <Card key={session.id} className="border border-slate-100 rounded-2xl overflow-visible shadow-sm hover:shadow-md transition-shadow bg-white">
                    <div
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                          <Calendar size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{formatDateFr(session.date)}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{session.className}</span>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                              {session.notes ? <FileEdit size={8} /> : <BookOpen size={8} />} {courseName}
                            </span>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                              <Clock size={8} /> {time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex gap-4">
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {session.presentCount} Présents
                          </span>
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            {session.absentCount} Absents
                          </span>
                          {session.lateCount > 0 && (
                            <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              {session.lateCount} Retards
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm font-black px-3 py-1 rounded-full ${
                            session.attendanceRate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {session.attendanceRate}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.id);
                          }}
                          disabled={deleting === session.id}
                        >
                          {deleting === session.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && session.records.length > 0 && (
                      <div className="border-t border-slate-50 bg-slate-50/30 max-h-[520px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Étudiant</TableHead>
                              <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">ID</TableHead>
                              <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                                Cumul Absences ({courseName})
                              </TableHead>
                              <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">
                                Statut Séance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.records.map((rec, i) => {
                              const style = STATUS_STYLE[rec.status] || STATUS_STYLE.ABSENT;
                              const cs = studentCourseMap.get(rec.studentId)?.get(courseKey);
                              return (
                                <TableRow key={i} className="border-slate-50 hover:bg-white/60">
                                  <TableCell className="pl-8 py-3 font-bold text-slate-800 text-sm">
                                    {rec.studentName || 'Inconnu'}
                                  </TableCell>
                                  <TableCell className="font-mono text-[10px] text-slate-400">
                                    #{rec.userId || rec.studentId}
                                  </TableCell>
                                  <TableCell>
                                    {cs && (
                                      <CourseAbsenceHoverBadge
                                        summary={cs}
                                        studentName={rec.studentName || 'Étudiant'}
                                        compact
                                      />
                                    )}
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

      {/* ═══ TAB 3: ANALYTICS TAB ══════════════════════════════════════════ */}
      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Présents" value={analytics.presentCount} icon={CheckCircle2} color="border-emerald-100 hover:border-emerald-300" />
            <StatCard label="Absents" value={analytics.absentCount} icon={XCircle} color="border-rose-100 hover:border-rose-300" />
            <StatCard label="En retard" value={analytics.lateCount} icon={Clock} color="border-amber-100 hover:border-amber-300" />
            <StatCard label="Excusés/Malades" value={analytics.excusedCount} icon={ShieldAlert} color="border-blue-100 hover:border-blue-300" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Répartition des présences</h3>
                <p className="text-[10px] font-bold text-slate-400">Détail du statut de tous les enregistrements</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={attendanceRatioData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
                <p className="text-[10px] font-bold text-slate-400">Taux moyen de présence pour chaque classe</p>
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
        </div>
      )}
    </div>
  );
}
