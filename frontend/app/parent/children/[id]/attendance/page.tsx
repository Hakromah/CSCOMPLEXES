/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download, AlertTriangle, CheckCircle, XCircle, Clock, Calendar,
  Filter, X, GraduationCap, ShieldAlert,
} from 'lucide-react';
import api from '@/lib/api';
import { generateAttendanceReport } from '@/lib/pdf-generator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { AttendanceRecord } from '@/types/school';

const EXPULSION_THRESHOLD = 3;

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PRESENT: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Présent' },
  ABSENT:  { color: 'text-rose-700',    bg: 'bg-rose-100',    label: 'Absent' },
  LATE:    { color: 'text-amber-700',   bg: 'bg-amber-100',   label: 'Retard' },
  EXCUSED: { color: 'text-blue-700',    bg: 'bg-blue-100',    label: 'Justifié' },
  SICK:    { color: 'text-purple-700',  bg: 'bg-purple-100',  label: 'Malade' },
};

const DAY_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-500',
  ABSENT:  'bg-rose-500',
  LATE:    'bg-amber-500',
  EXCUSED: 'bg-blue-500',
  SICK:    'bg-purple-500',
};

interface AbsenceOccurrence {
  id: number;
  date: string;
  time: string;
  className: string;
  courseName: string;
  status: string;
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

function ParentCourseAbsenceCard({ summary, studentName }: { summary: CourseAbsenceSummary; studentName: string }) {
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
    const estimatedHeight = 260;
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
            {summary.className || 'Classe'}
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
                  Détails des absences ({summary.className})
                </p>
                <h5 className="text-xs font-black text-white mt-0.5">{summary.courseName}</h5>
                <p className="text-[10px] font-bold text-slate-400">{studentName}</p>
              </div>
              <Badge className="bg-rose-600 text-white border-none font-black text-[9px]">
                {count} / {EXPULSION_THRESHOLD} Absences
              </Badge>
            </div>

            {isCritical && (
              <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-700/70 rounded-xl px-3 py-2 mb-2.5">
                <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                <p className="text-[10px] font-bold text-rose-200 leading-tight">
                  Risque d&apos;exclusion du cours : votre enfant a cumulé {count} absences dans cette matière (seuil: {EXPULSION_THRESHOLD}).
                </p>
              </div>
            )}

            {summary.absences.length === 0 ? (
              <p className="text-[11px] text-emerald-400 font-bold text-center py-2">
                ✓ Aucune absence enregistrée dans ce cours
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

export default function ChildAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [records, setRecords] = useState<
    (AttendanceRecord & {
      createdAt?: string;
      session?: {
        date: string;
        subject?: { name: string };
        classe?: { id: number; name: string };
        sessionTime?: string;
        createdAt?: string;
        notes?: string;
      };
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [studentClasses, setStudentClasses] = useState<any[]>([]);

  // Filters: Class, Subject, Date, Month, Year, Status
  const [classFilter, setClassFilter]     = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter]       = useState<string>('');
  const [monthFilter, setMonthFilter]     = useState<string>('all');
  const [year, setYear]                   = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter]   = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attendRes, studentRes, kidsRes] = await Promise.all([
        api.get(`/parent/children/${id}/attendance?all=true`),
        api.get(`/parent/children/${id}`),
        api.get('/parent/children').catch(() => ({ data: [] })),
      ]);
      setRecords(attendRes.data?.records || []);
      const s = studentRes.data;
      setStudentName(s?.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : s?.username || 'Élève');
      setStudentClasses(Array.isArray(s?.classes) ? s.classes : Array.isArray(s?.enrolledClasses) ? s.enrolledClasses : []);
      setChildrenList(Array.isArray(kidsRes.data) ? kidsRes.data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Available Classes & Subjects ────────────────────────────────────────────
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    studentClasses.forEach((c: any) => {
      if (c?.name) set.add(c.name);
    });
    records.forEach((r) => {
      if (r.session?.classe?.name) set.add(r.session.classe.name);
    });
    return Array.from(set).sort();
  }, [studentClasses, records]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const name = r.session?.notes || r.session?.subject?.name || 'Séance générale';
      set.add(name);
    });
    return Array.from(set).sort();
  }, [records]);

  // ── Per-Course Absence Breakdown ────────────────────────────────────────────
  const courseSummaries = useMemo(() => {
    const map = new Map<string, CourseAbsenceSummary>();
    for (const r of records) {
      const clsName = r.session?.classe?.name || studentClasses[0]?.name || 'Classe';
      if (classFilter !== 'all' && clsName !== classFilter) continue;

      const courseName = r.session?.notes || r.session?.subject?.name || 'Séance générale';
      if (subjectFilter !== 'all' && courseName !== subjectFilter) continue;

      if (!map.has(courseName)) {
        map.set(courseName, {
          courseName,
          className: clsName,
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
      const st = r.status || 'ABSENT';
      if (st === 'PRESENT') entry.presentCount++;
      else if (st === 'ABSENT') {
        entry.absentCount++;
        entry.absences.push({
          id: r.id,
          date: r.session?.date || '',
          time: formatSessionTime(r.session?.sessionTime, r.session?.createdAt || r.createdAt),
          className: clsName,
          courseName,
          status: st,
          notes: r.session?.notes,
        });
      } else if (st === 'LATE') entry.lateCount++;
      else entry.excusedCount++;

      entry.rate =
        entry.totalSessions > 0
          ? Math.round(((entry.presentCount + entry.lateCount) / entry.totalSessions) * 100)
          : 100;
    }
    return Array.from(map.values()).sort((a, b) => b.absentCount - a.absentCount);
  }, [records, classFilter, subjectFilter, studentClasses]);

  // ── Filtered Records ────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const clsName = r.session?.classe?.name || studentClasses[0]?.name || 'Classe';
      if (classFilter !== 'all' && clsName !== classFilter) return false;
      const courseName = r.session?.notes || r.session?.subject?.name || 'Séance générale';
      if (subjectFilter !== 'all' && courseName !== subjectFilter) return false;
      if (dateFilter && r.session?.date !== dateFilter) return false;
      if (monthFilter !== 'all') {
        if (!r.session?.date) return false;
        const d = new Date(r.session.date);
        if (d.getMonth() + 1 !== Number(monthFilter) || d.getFullYear() !== year) return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, classFilter, subjectFilter, dateFilter, monthFilter, year, statusFilter, studentClasses]);

  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = filteredRecords.filter((r) => r.status === 'ABSENT').length;
    const late = filteredRecords.filter((r) => r.status === 'LATE').length;
    const excused = filteredRecords.filter((r) => r.status === 'EXCUSED').length;
    const sick = filteredRecords.filter((r) => r.status === 'SICK').length;
    const presentPercent = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
    return { total, present, absent, late, excused, sick, presentPercent };
  }, [filteredRecords]);

  const handleDownload = () => {
    const doc = generateAttendanceReport({
      studentName,
      period:
        monthFilter !== 'all'
          ? new Date(year, Number(monthFilter) - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
          : `Année scolaire ${year}`,
      records: filteredRecords.map((r) => ({
        date: r.session?.date || '',
        subject: r.session?.notes || r.session?.subject?.name,
        status: r.status,
        sessionTime: formatSessionTime(r.session?.sessionTime, r.session?.createdAt || r.createdAt),
      })),
      summary,
    });
    doc.save(`presence_${studentName.replace(/\s+/g, '_')}_${year}.pdf`);
  };

  // Calendar month for heatmap
  const calendarMonth = monthFilter !== 'all' ? Number(monthFilter) : new Date().getMonth() + 1;
  const daysInMonth = new Date(year, calendarMonth, 0).getDate();
  const firstDay = new Date(year, calendarMonth - 1, 1).getDay();
  const recordsByDate: Record<number, string> = {};
  filteredRecords.forEach((r) => {
    if (r.session?.date) {
      const d = new Date(r.session.date);
      if (d.getMonth() + 1 === calendarMonth && d.getFullYear() === year) {
        recordsByDate[d.getDate()] = r.status;
      }
    }
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2024, i).toLocaleString('fr-FR', { month: 'long' }),
  }));

  const criticalCourses = courseSummaries.filter((c) => c.absentCount >= EXPULSION_THRESHOLD);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-1">
            <Link href="/parent/children" className="hover:text-primary">Mes Enfants</Link>
            <span>/</span>
            <Link href={`/parent/children/${id}`} className="hover:text-primary">{studentName}</Link>
            <span>/</span>
            <span className="text-slate-700">Présences & Absences par Cours</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Suivi d&apos;Assiduité — <span className="text-primary">{studentName}</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Seuil critique d&apos;exclusion d&apos;un cours : {EXPULSION_THRESHOLD}+ absences soumises par l&apos;enseignant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-slate-900 hover:bg-primary text-white rounded-xl px-4 h-11 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Expulsion Risk Alert */}
      {criticalCourses.length > 0 && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-black text-rose-800">
              Alerte Critique : Risque d&apos;Exclusion de Cours ({EXPULSION_THRESHOLD}+ absences)
            </p>
            <p className="text-xs text-rose-700 font-bold mt-0.5">
              {studentName} a cumulé {EXPULSION_THRESHOLD} absences ou plus en :{' '}
              <strong>{criticalCourses.map((c) => `${c.courseName} (${c.absentCount} absences)`).join(', ')}</strong>.
              Survolez le cours ci-dessous pour voir les dates et heures exactes.
            </p>
          </div>
        </div>
      )}

      {/* 4-Filter Control Bar: Child (Student), Class, Subject, Date, Month */}
      <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
              Vérifier les présences par Enfant, Classe, Date et Matière
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
              className="text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-8 rounded-xl"
            >
              <X size={12} className="mr-1" /> Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Student (Child Switcher) */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enfant / Élève</label>
            <Select
              value={String(id)}
              onValueChange={(newId) => {
                if (newId !== String(id)) router.push(`/parent/children/${newId}/attendance`);
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder={studentName || 'Sélectionner'} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {childrenList.length > 0 ? (
                  childrenList.map((child: any) => {
                    const nm = child.firstName
                      ? `${child.firstName} ${child.lastName || ''}`.trim()
                      : child.username || `Élève #${child.id}`;
                    return (
                      <SelectItem key={child.id} value={String(child.id)} className="font-bold">
                        {nm}
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value={String(id)} className="font-bold">{studentName}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Class */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Classe</label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Toutes les classes</SelectItem>
                {availableClasses.map((c) => (
                  <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Subject */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Matière / Cours</label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Toutes les matières" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Toutes les matières</SelectItem>
                {availableSubjects.map((s) => (
                  <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Date */}
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

          {/* 5. Month */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mois</label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                <SelectValue placeholder="Tous les mois" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">Toute l&apos;année</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="font-bold capitalize">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 6. Status */}
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

      {/* Per-Course Absence Tracker with Hover Popover (Dates & Times) */}
      <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-visible">
        <CardHeader className="border-b border-slate-50 px-8 py-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <GraduationCap size={16} className="text-primary" />
            Absences par Matière — Survolez un cours pour afficher la Date et l&apos;Heure de chaque absence
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Cumul total des absences soumises par les enseignants pour chaque cours de {studentName}.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {courseSummaries.length === 0 ? (
            <p className="text-center text-xs font-bold text-slate-400 py-6">
              Aucune séance enregistrée pour les critères sélectionnés.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {courseSummaries.map((cs) => (
                <ParentCourseAbsenceCard key={cs.courseName} summary={cs} studentName={studentName} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Présent', value: summary.present, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent', value: summary.absent, icon: XCircle, color: 'text-rose-600 bg-rose-50' },
          { label: 'Retard', value: summary.late, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Justifié', value: summary.excused + summary.sick, icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
          {
            label: 'Taux',
            value: `${summary.presentPercent}%`,
            icon: CheckCircle,
            color: summary.presentPercent >= 75 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50',
          },
        ].map((item) => (
          <div key={item.label} className={`${item.color} rounded-2xl p-4 flex flex-col items-center gap-1`}>
            <item.icon className="w-5 h-5" />
            <p className="text-2xl font-black">{item.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">
              Journal Détaillé des Séances ({filteredRecords.length})
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Date, Heure, Classe, Matière et Statut de présence
            </p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
            <CheckCircle className="w-8 h-8 opacity-30" />
            <p className="text-sm font-bold">Aucun enregistrement trouvé pour cette sélection</p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Heure</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Classe</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Matière / Cours</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cumul Absences Cours</th>
                  <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((record) => {
                  const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.PRESENT;
                  const courseName = record.session?.notes || record.session?.subject?.name || 'Séance générale';
                  const clsName = record.session?.classe?.name || studentClasses[0]?.name || '—';
                  const courseSum = courseSummaries.find((c) => c.courseName === courseName);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-black text-slate-800 text-xs">
                        {formatDateFr(record.session?.date)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">
                        {formatSessionTime(record.session?.sessionTime, record.session?.createdAt || record.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-bold text-xs">{clsName}</td>
                      <td className="px-6 py-3.5 text-primary font-black text-xs">{courseName}</td>
                      <td className="px-6 py-3.5">
                        <Badge
                          className={`border-none font-black text-[10px] ${
                            (courseSum?.absentCount || 0) >= EXPULSION_THRESHOLD
                              ? 'bg-rose-600 text-white'
                              : (courseSum?.absentCount || 0) > 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {courseSum?.absentCount || 0} absence(s)
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Calendrier Mensuel ({months.find((m) => Number(m.value) === calendarMonth)?.label} {year})
          </h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
            <p key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const status = recordsByDate[day];
            return (
              <div
                key={day}
                className={`h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                  status ? `${DAY_COLORS[status]} text-white` : 'bg-slate-100 text-slate-400'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
