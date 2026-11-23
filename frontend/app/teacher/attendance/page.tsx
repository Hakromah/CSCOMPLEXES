/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Papa from 'papaparse';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Users, ClipboardCheck, Loader2, Save, History,
  PlusCircle, Search, CheckCheck, X, Clock, UserCheck,
  ShieldCheck, BookOpen, FileEdit, AlertTriangle, ShieldAlert,
  Filter, Eye, GraduationCap,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

interface Student {
  id: number;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  userId: string;
}

interface Subject {
  id: number;
  name: string;
  code?: string | null;
}

interface AttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
}

interface HistorySession {
  id: number;
  date: string;
  sessionTime: string | null;
  createdAt?: string | null;
  classId?: number | null;
  className?: string | null;
  subjectName: string | null;
  subjectCode?: string | null;
  subjectId: number | null;
  notes: string | null;
  totalCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  records: { id?: number; studentId: number; userId?: string | null; studentName: string; status: string }[];
}

interface AbsenceOccurrence {
  sessionId: number;
  date: string;
  time: string;
  courseName: string;
  status: AttendanceStatus;
  notes?: string | null;
}

interface CourseAbsenceSummary {
  courseKey: string;
  courseName: string;
  subjectId: number | null;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  absences: AbsenceOccurrence[];
  allRecords: AbsenceOccurrence[];
}

const EXPULSION_THRESHOLD = 3;

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; dot: string }> = {
  PRESENT: { label: 'Présent',  bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ABSENT:  { label: 'Absent',   bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    dot: 'bg-rose-500'   },
  LATE:    { label: 'Retard',   bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500'  },
  EXCUSED: { label: 'Justifié', bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',    dot: 'bg-blue-500'   },
  SICK:    { label: 'Malade',   bg: 'bg-purple-50 border-purple-200',   text: 'text-purple-700',  dot: 'bg-purple-500' },
};

const STATUS_CYCLE: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];

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

function StatusButton({ status, onChange }: { status: AttendanceStatus; onChange: (s: AttendanceStatus) => void }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PRESENT;
  const next = () => onChange(STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length]);
  return (
    <button
      type="button"
      onClick={next}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-[10px] uppercase tracking-widest transition-all duration-200 hover:shadow-sm active:scale-95 cursor-pointer ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </button>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

// ── Portal Hover Badge showing total course absences + unclipped popover with date & time ──
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
        {!compact && <span className="truncate max-w-[120px]">{summary.courseName}:</span>}
        <span>{count} absence{count !== 1 ? 's' : ''}</span>
        {isCritical && <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full">Seuil critique</span>}
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
            className="w-80 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                  Détails des absences du cours
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

            {/* Stats summary */}
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
                  Risque d&apos;exclusion du cours : cet étudiant a cumulé {count} absences dans cette matière (seuil: {EXPULSION_THRESHOLD}).
                </p>
              </div>
            )}

            {/* Chronological absence dates & times */}
            {summary.absences.length === 0 ? (
              <p className="text-[11px] text-emerald-400 font-bold text-center py-2">
                ✓ Aucune absence enregistrée pour ce cours
              </p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Historique des absences (Date & Heure)
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
                        {ab.notes && <p className="text-[9px] text-amber-300 truncate max-w-[140px]">{ab.notes}</p>}
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

// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherAttendancePage() {
  const [classes, setClasses]                   = useState<any[]>([]);
  const [students, setStudents]                 = useState<Student[]>([]);
  const [subjects, setSubjects]                 = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass]       = useState<string>('');
  const [selectedSubject, setSelectedSubject]   = useState<string>('');  // 'none' | 'other' | '<id>'
  const [otherNote, setOtherNote]               = useState<string>('');  // custom text when "other"
  const [sessionTime, setSessionTime]           = useState<string>(() => new Date().toTimeString().slice(0, 5));
  const [attendance, setAttendance]             = useState<AttendanceRecord[]>([]);
  const [view, setView]                         = useState<'mark' | 'tracker' | 'history'>('mark');
  const [history, setHistory]                   = useState<HistorySession[]>([]);
  const [search, setSearch]                     = useState('');
  const [sessionDate, setSessionDate]           = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing]               = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting]             = useState(false);
  const [loadingStudents, setLoadingStudents]   = useState(false);
  const [loadingSubjects, setLoadingSubjects]   = useState(false);

  // ── Tracker Filters (Student, Subject, Date, Status) ──
  const [trackerStudentId, setTrackerStudentId] = useState<string>('all');
  const [trackerSubject, setTrackerSubject]     = useState<string>('all');
  const [trackerDate, setTrackerDate]           = useState<string>('');
  const [trackerStatus, setTrackerStatus]       = useState<string>('all');

  const isOtherSelected = selectedSubject === 'other';

  // ── Load classes on mount ───────────────────────────────────────────────────
  useEffect(() => {
    api.get('/teacher/classes')
      .then(r => setClasses(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Échec du chargement des classes'));
  }, []);

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const r = await api.get(`/teacher/classes/${classId}/students`);
      const list = Array.isArray(r.data) ? r.data : [];
      setStudents(list);
      setAttendance(list.map((s: Student) => ({ studentId: s.id, status: 'PRESENT' as AttendanceStatus })));
    } catch { toast.error('Échec du chargement des étudiants'); }
    finally { setLoadingStudents(false); }
  };

  const fetchSubjects = async (classId: string) => {
    setLoadingSubjects(true);
    try {
      const r = await api.get(`/teacher/classes/${classId}/subjects`);
      setSubjects(Array.isArray(r.data) ? r.data : []);
    } catch {
      try {
        const r2 = await api.get('/teacher/subjects');
        setSubjects(Array.isArray(r2.data) ? r2.data : []);
      } catch {
        setSubjects([]);
      }
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchHistory = async (classId: string) => {
    try {
      const r = await api.get(`/teacher/classes/${classId}/attendance-history`);
      setHistory(Array.isArray(r.data) ? r.data : []);
    } catch { toast.error('Échec du chargement de l’historique des présences'); }
  };

  // ── Class selection ─────────────────────────────────────────────────────────
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedSubject('');
    setOtherNote('');
    setSessionTime(new Date().toTimeString().slice(0, 5));
    setIsEditing(false);
    setCurrentSessionId(null);
    setSearch('');
    setTrackerStudentId('all');
    setTrackerSubject('all');
    setTrackerDate('');
    fetchStudents(classId);
    fetchSubjects(classId);
    fetchHistory(classId);
  };

  // ── Compute Per-Student, Per-Course Absence Summaries from History ──────────
  const studentCourseMap = useMemo(() => {
    // Map<studentId, Map<courseKey, CourseAbsenceSummary>>
    const map = new Map<number, Map<string, CourseAbsenceSummary>>();

    for (const session of history) {
      const courseName = session.notes
        ? session.notes
        : session.subjectName || 'Séance générale';
      const courseKey = session.subjectId
        ? `subj-${session.subjectId}`
        : `note-${courseName.toLowerCase()}`;
      const timeFormatted = formatSessionTime(session.sessionTime, session.createdAt);

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
            subjectId: session.subjectId || null,
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
        const st = (rec.status || 'ABSENT') as AttendanceStatus;
        if (st === 'PRESENT') summary.presentCount++;
        else if (st === 'ABSENT') summary.absentCount++;
        else if (st === 'LATE') summary.lateCount++;
        else summary.excusedCount++;

        const occ: AbsenceOccurrence = {
          sessionId: session.id,
          date: session.date,
          time: timeFormatted,
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
  }, [history]);

  // Helper to get a student's course summary for the currently active subject in "Mark Session" view
  const getActiveCourseSummaryForStudent = (studentId: number): CourseAbsenceSummary => {
    const stCourses = studentCourseMap.get(studentId);
    const activeSubjectObj = subjects.find((s) => String(s.id) === selectedSubject);

    if (selectedSubject && selectedSubject !== 'none' && !isOtherSelected && activeSubjectObj) {
      const key = `subj-${activeSubjectObj.id}`;
      return (
        stCourses?.get(key) || {
          courseKey: key,
          courseName: activeSubjectObj.name,
          subjectId: activeSubjectObj.id,
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          absences: [],
          allRecords: [],
        }
      );
    }

    if (isOtherSelected && otherNote.trim()) {
      const key = `note-${otherNote.trim().toLowerCase()}`;
      return (
        stCourses?.get(key) || {
          courseKey: key,
          courseName: otherNote.trim(),
          subjectId: null,
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          absences: [],
          allRecords: [],
        }
      );
    }

    // Aggregate across all courses in this class when no specific subject is selected yet
    const allSummaries = stCourses ? Array.from(stCourses.values()) : [];
    return {
      courseKey: 'all',
      courseName: 'Tous les cours (Cumul)',
      subjectId: null,
      totalSessions: allSummaries.reduce((acc, s) => acc + s.totalSessions, 0),
      presentCount: allSummaries.reduce((acc, s) => acc + s.presentCount, 0),
      absentCount: allSummaries.reduce((acc, s) => acc + s.absentCount, 0),
      lateCount: allSummaries.reduce((acc, s) => acc + s.lateCount, 0),
      excusedCount: allSummaries.reduce((acc, s) => acc + s.excusedCount, 0),
      absences: allSummaries
        .flatMap((s) => s.absences.map((a) => ({ ...a, notes: a.courseName })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      allRecords: allSummaries.flatMap((s) => s.allRecords),
    };
  };

  // ── Unique course names available in history + subjects list ────────────────
  const availableCourseNames = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => set.add(s.name));
    history.forEach((h) => {
      const name = h.notes || h.subjectName || 'Séance générale';
      set.add(name);
    });
    return Array.from(set).sort();
  }, [subjects, history]);

  // ── Filtered students for Mark Session table ────────────────────────────────
  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        const q = search.toLowerCase();
        const fullName =
          s.firstName && s.lastName
            ? `${s.firstName} ${s.lastName}`
            : s.username || s.name || '';
        return (
          fullName.toLowerCase().includes(q) ||
          (s.userId || '').toLowerCase().includes(q)
        );
      }),
    [students, search]
  );

  // ── Tracker Filtered Student-Course Rows & Detailed Flat Records ────────────
  const trackerStudentRows = useMemo(() => {
    const targetStudents = students.filter((s) => {
      if (trackerStudentId !== 'all' && String(s.id) !== trackerStudentId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullName =
          s.firstName && s.lastName
            ? `${s.firstName} ${s.lastName}`
            : s.username || s.name || '';
        if (!fullName.toLowerCase().includes(q) && !(s.userId || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    return targetStudents.map((student) => {
      const fullName =
        student.firstName && student.lastName
          ? `${student.firstName} ${student.lastName}`
          : student.username || student.name || `Étudiant #${student.id}`;
      const stCourses = studentCourseMap.get(student.id);
      let courseSummaries = stCourses ? Array.from(stCourses.values()) : [];

      if (trackerSubject !== 'all') {
        courseSummaries = courseSummaries.filter((c) => c.courseName === trackerSubject);
        if (courseSummaries.length === 0) {
          courseSummaries = [
            {
              courseKey: `empty-${trackerSubject}`,
              courseName: trackerSubject,
              subjectId: null,
              totalSessions: 0,
              presentCount: 0,
              absentCount: 0,
              lateCount: 0,
              excusedCount: 0,
              absences: [],
              allRecords: [],
            },
          ];
        }
      }

      if (trackerDate) {
        courseSummaries = courseSummaries
          .map((c) => {
            const matchingRecs = c.allRecords.filter((r) => r.date === trackerDate);
            const matchingAbs = c.absences.filter((a) => a.date === trackerDate);
            return {
              ...c,
              totalSessions: matchingRecs.length,
              presentCount: matchingRecs.filter((r) => r.status === 'PRESENT').length,
              absentCount: matchingAbs.length,
              lateCount: matchingRecs.filter((r) => r.status === 'LATE').length,
              excusedCount: matchingRecs.filter((r) => r.status === 'EXCUSED' || r.status === 'SICK').length,
              absences: matchingAbs,
              allRecords: matchingRecs,
            };
          })
          .filter((c) => c.totalSessions > 0);
      }

      const totalAbsences = courseSummaries.reduce((acc, c) => acc + c.absentCount, 0);
      const maxCourseAbsences = courseSummaries.reduce((max, c) => Math.max(max, c.absentCount), 0);
      const totalSessions = courseSummaries.reduce((acc, c) => acc + c.totalSessions, 0);
      const totalPresent = courseSummaries.reduce((acc, c) => acc + c.presentCount + c.lateCount, 0);
      const rate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 100;

      return {
        student,
        fullName,
        courseSummaries,
        totalAbsences,
        maxCourseAbsences,
        totalSessions,
        rate,
      };
    });
  }, [students, studentCourseMap, trackerStudentId, trackerSubject, trackerDate, search]);

  const trackerFlatRecords = useMemo(() => {
    const rows: {
      sessionId: number;
      date: string;
      time: string;
      courseName: string;
      studentId: number;
      studentName: string;
      userId: string;
      status: AttendanceStatus;
      courseSummary: CourseAbsenceSummary;
      session: HistorySession;
    }[] = [];

    for (const session of history) {
      if (trackerDate && session.date !== trackerDate) continue;
      const courseName = session.notes || session.subjectName || 'Séance générale';
      if (trackerSubject !== 'all' && courseName !== trackerSubject) continue;
      const courseKey = session.subjectId
        ? `subj-${session.subjectId}`
        : `note-${courseName.toLowerCase()}`;
      const time = formatSessionTime(session.sessionTime, session.createdAt);

      for (const rec of session.records || []) {
        if (trackerStudentId !== 'all' && String(rec.studentId) !== trackerStudentId) continue;
        const st = (rec.status || 'ABSENT') as AttendanceStatus;
        if (trackerStatus !== 'all' && st !== trackerStatus) continue;

        const studentObj = students.find((s) => s.id === rec.studentId);
        const studentName =
          studentObj?.firstName && studentObj?.lastName
            ? `${studentObj.firstName} ${studentObj.lastName}`
            : rec.studentName || studentObj?.username || studentObj?.name || 'Étudiant';
        const userId = rec.userId || studentObj?.userId || String(rec.studentId);

        if (search.trim()) {
          const q = search.toLowerCase();
          if (!studentName.toLowerCase().includes(q) && !userId.toLowerCase().includes(q)) continue;
        }

        const courseSummary = studentCourseMap.get(rec.studentId)?.get(courseKey) || {
          courseKey,
          courseName,
          subjectId: session.subjectId || null,
          totalSessions: 1,
          presentCount: st === 'PRESENT' ? 1 : 0,
          absentCount: st === 'ABSENT' ? 1 : 0,
          lateCount: st === 'LATE' ? 1 : 0,
          excusedCount: st === 'EXCUSED' || st === 'SICK' ? 1 : 0,
          absences: [],
          allRecords: [],
        };

        rows.push({
          sessionId: session.id,
          date: session.date,
          time,
          courseName,
          studentId: rec.studentId,
          studentName,
          userId,
          status: st,
          courseSummary,
          session,
        });
      }
    }

    return rows;
  }, [history, trackerDate, trackerSubject, trackerStudentId, trackerStatus, students, search, studentCourseMap]);

  // ── Live analytics for Mark Session ─────────────────────────────────────────
  const presentCount   = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount    = attendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount      = attendance.filter((a) => a.status === 'LATE').length;
  const excusedCount   = attendance.filter((a) => a.status === 'EXCUSED' || a.status === 'SICK').length;
  const attendanceRate =
    students.length > 0 ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0;

  // ── Status helpers ──────────────────────────────────────────────────────────
  const setStatus = (studentId: number, status: AttendanceStatus) =>
    setAttendance((prev) => prev.map((a) => (a.studentId === studentId ? { ...a, status } : a)));

  const markAll = (status: AttendanceStatus) =>
    setAttendance((prev) => prev.map((a) => ({ ...a, status })));

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        if (data.length === 0) {
          toast.error('Le fichier CSV est vide.');
          return;
        }

        const firstRow = data[0];
        const statusKey = Object.keys(firstRow).find(
          (k) => k.toLowerCase() === 'status' || k.toLowerCase() === 'statut'
        );
        const idKey = Object.keys(firstRow).find(
          (k) =>
            k.toLowerCase() === 'studentid' ||
            k.toLowerCase() === 'userid' ||
            k.toLowerCase() === 'student id' ||
            k.toLowerCase() === 'user id' ||
            k.toLowerCase() === 'identifiant'
        );

        if (!statusKey || !idKey) {
          toast.error('Le CSV doit contenir des colonnes pour Student ID/User ID et Status/Statut.');
          return;
        }

        let matchedCount = 0;
        const newAttendance = attendance.map((item) => {
          const student = students.find((s) => s.id === item.studentId);
          if (!student) return item;

          const csvRow = data.find((row) => {
            const csvId = String(row[idKey]).trim().toLowerCase();
            return (
              csvId === String(student.id).toLowerCase() ||
              csvId === String(student.userId).trim().toLowerCase()
            );
          });

          if (csvRow) {
            const csvStatus = String(csvRow[statusKey]).trim().toUpperCase() as AttendanceStatus;
            if (allowedStatuses.includes(csvStatus)) {
              matchedCount++;
              return { ...item, status: csvStatus };
            }
          }
          return item;
        });

        setAttendance(newAttendance);
        toast.success(`${matchedCount} enregistrements importés depuis le CSV.`);
        e.target.value = '';
      },
      error: () => {
        toast.error('Erreur lors de la lecture du fichier CSV.');
      },
    });
  };

  // ── Submit / Update ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedClass) return toast.error('Veuillez sélectionner une classe.');
    if (students.length === 0) return toast.error('Aucun étudiant trouvé dans cette classe.');
    if (isOtherSelected && !otherNote.trim()) return toast.error('Veuillez décrire l’événement pour "Autre".');

    setSubmitting(true);
    const tid = toast.loading(isEditing ? 'Mise à jour de la séance...' : 'Enregistrement des présences...');

    const payload: any = {
      classId: parseInt(selectedClass),
      date: sessionDate,
      sessionTime: sessionTime || new Date().toTimeString().slice(0, 5),
      records: attendance.map((a) => ({ studentId: a.studentId, status: a.status })),
    };
    if (selectedSubject && selectedSubject !== 'none' && !isOtherSelected) {
      payload.subjectId = parseInt(selectedSubject);
    }
    if (isOtherSelected && otherNote.trim()) {
      payload.notes = otherNote.trim();
    }

    try {
      if (isEditing && currentSessionId) {
        await api.put(`/teacher/attendance/${currentSessionId}`, payload);
        toast.success('Séance mise à jour avec succès ✓', { id: tid });
        setIsEditing(false);
        setCurrentSessionId(null);
        await fetchHistory(selectedClass);
        setView('tracker');
      } else {
        await api.post('/teacher/attendance', payload);
        toast.success('Présences enregistrées avec succès ✓', { id: tid });
        setAttendance(students.map((s) => ({ studentId: s.id, status: 'PRESENT' as AttendanceStatus })));
        await fetchHistory(selectedClass);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        'Échec de la synchronisation — vérifiez la connexion';
      toast.error(String(msg), { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit session ────────────────────────────────────────────────────────────
  const handleEditSession = async (session: HistorySession) => {
    const tid = toast.loading('Chargement de la séance...');
    try {
      setIsEditing(true);
      setCurrentSessionId(session.id);
      setSessionDate(session.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setSessionTime(session.sessionTime || new Date().toTimeString().slice(0, 5));

      if (session.notes) {
        setSelectedSubject('other');
        setOtherNote(session.notes);
      } else if (session.subjectId) {
        setSelectedSubject(String(session.subjectId));
        setOtherNote('');
      } else {
        setSelectedSubject('none');
        setOtherNote('');
      }

      const r = await api.get(`/teacher/classes/${selectedClass}/students`);
      const fetched: Student[] = Array.isArray(r.data) ? r.data : [];
      setStudents(fetched);

      const statusMap = new Map<number, AttendanceStatus>();
      for (const rec of session.records) {
        if (rec.studentId) statusMap.set(rec.studentId, rec.status as AttendanceStatus);
      }
      setAttendance(fetched.map((s) => ({ studentId: s.id, status: statusMap.get(s.id) ?? 'ABSENT' })));

      setView('mark');
      toast.success('Séance chargée en mode modification', { id: tid });
    } catch {
      toast.error('Impossible de charger les détails de la séance', { id: tid });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentSessionId(null);
    setSessionTime(new Date().toTimeString().slice(0, 5));
    setSelectedSubject('');
    setOtherNote('');
    setView('history');
  };

  const subjectLabel = isOtherSelected
    ? otherNote || 'Événement personnalisé'
    : subjects.find((s) => String(s.id) === selectedSubject)?.name || null;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-6 bg-[#f8fafc]">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck size={15} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Présence & Suivi d&apos;Assiduité</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.5rem)] font-black tracking-tighter text-slate-900 italic">
            Registre <span className="text-primary">Académique.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <Calendar size={10} />
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            <span className="text-rose-500 font-black ml-2">• Seuil d&apos;exclusion cours : {EXPULSION_THRESHOLD}+ absences</span>
          </p>
        </div>

        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="w-full md:w-[260px] h-12 rounded-2xl bg-white shadow-sm font-black text-xs uppercase tracking-widest border-slate-200 hover:border-primary transition-colors duration-300">
            <SelectValue placeholder="Sélectionner une classe" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)} className="font-bold">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── View tabs ── */}
      {selectedClass && (
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setView('mark')}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
              view === 'mark'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <PlusCircle size={13} /> {isEditing ? '✎ Modification en cours' : 'Nouvelle Séance'}
          </Button>
          <Button
            onClick={() => {
              setView('tracker');
              fetchHistory(selectedClass);
            }}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
              view === 'tracker'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <Eye size={13} /> Suivi Absences par Étudiant & Matière
          </Button>
          <Button
            onClick={() => {
              setView('history');
              fetchHistory(selectedClass);
            }}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
              view === 'history'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <History size={13} /> Historique des Séances ({history.length})
          </Button>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══════════════════════════════════════════════════════ */}
      {!selectedClass ? (
        <div className="h-[460px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-primary/40 transition-colors duration-500">
          <div className="p-8 bg-slate-50 rounded-3xl mb-6">
            <Users size={64} className="text-slate-200" />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Sélectionner une classe</h2>
          <p className="text-slate-400 text-sm font-medium mt-2 text-center max-w-sm">
            Choisissez une classe ci-dessus pour faire l&apos;appel ou contrôler le cumul d&apos;absences des étudiants par matière, date et heure.
          </p>
        </div>
      ) : view === 'mark' ? (
        /* ═══ MARK SESSION VIEW ════════════════════════════════════════════ */
        <div className="space-y-5">
          {/* Live analytics bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-6">
                <StatPill label="Total" value={students.length} color="text-slate-900" />
                <StatPill label="Présent" value={presentCount} color="text-emerald-600" />
                <StatPill label="Absent" value={absentCount} color="text-rose-600" />
                <StatPill label="Retard" value={lateCount} color="text-amber-600" />
                <StatPill label="Justifié" value={excusedCount} color="text-blue-600" />
              </div>
              <div className="flex items-center gap-3 min-w-[160px]">
                <span className={`text-2xl font-black ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {attendanceRate}%
                </span>
                <div className="flex-1">
                  <Progress value={attendanceRate} className="h-2 rounded-full bg-slate-100" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">Taux de présence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails de la séance</p>
              <p className="text-[10px] font-bold text-slate-500">
                💡 Astuce : Survolez le badge d&apos;absences d&apos;un étudiant pour voir les dates et heures exactes de ses absences dans ce cours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Calendar size={10} /> Date de la séance
                </label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-4 h-11">
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={10} /> Matière / Cours
                  {loadingSubjects && <Loader2 size={10} className="animate-spin text-primary" />}
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={(v) => {
                    setSelectedSubject(v);
                    setOtherNote('');
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-sm hover:border-primary transition-colors">
                    <SelectValue placeholder={loadingSubjects ? 'Chargement...' : 'Sélectionner une matière'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-64 overflow-y-auto">
                    <SelectItem value="none" className="font-bold text-slate-400 italic">
                      Sans matière spécifique
                    </SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="font-bold">
                        {s.name}
                        {s.code ? ` (${s.code})` : ''}
                      </SelectItem>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
                    <SelectItem value="other" className="font-black text-primary">
                      Autre / Événement personnalisé
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Time */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Clock size={10} /> Heure de séance
                </label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-4 h-11 hover:border-primary transition-colors">
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {isOtherSelected && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <FileEdit size={10} /> Nom du cours ou de l&apos;événement
                </label>
                <Input
                  placeholder="ex. Travaux Pratiques, Sortie pédagogique, Séminaire..."
                  value={otherNote}
                  onChange={(e) => setOtherNote(e.target.value)}
                  className="h-11 rounded-xl bg-amber-50 border-amber-200 font-bold text-sm"
                />
              </div>
            )}
          </div>

          {/* Search + bulk actions */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
              <Input
                placeholder="Rechercher un étudiant (nom ou ID)..."
                className="pl-9 h-11 rounded-xl bg-white border-slate-100 font-bold text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 cursor-pointer"
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <FileEdit size={12} /> Importer CSV
              </Button>
              <input id="csv-file-input" type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 cursor-pointer"
                onClick={() => markAll('PRESENT')}
              >
                <CheckCheck size={12} /> Tous Présents
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 cursor-pointer"
                onClick={() => markAll('ABSENT')}
              >
                <X size={12} /> Tous Absents
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 cursor-pointer"
                onClick={() => markAll('LATE')}
              >
                <Clock size={12} /> Tous en Retard
              </Button>
            </div>
          </div>

          {/* Student Registry Table */}
          <Card className="border border-slate-100 rounded-3xl overflow- visible shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 px-8 py-4 flex flex-row items-center justify-between bg-white rounded-t-3xl">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Registre de la classe</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {loadingStudents ? 'Chargement...' : `${students.length} étudiants inscrits`}
                  {subjectLabel ? ` • Cours sélectionné : ${subjectLabel}` : ''}
                </p>
              </div>
              <Badge
                className={`font-black px-4 py-1 rounded-full uppercase text-[9px] border-none ${
                  isEditing ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-primary'
                }`}
              >
                {isEditing ? '✎ Mode Modification' : '+ Nouvelle Séance'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[520px] overflow-y-auto">
              {loadingStudents ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400 w-[140px]">
                        N° Étudiant
                      </TableHead>
                      <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                        Nom complet
                      </TableHead>
                      <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                        Absences enregistrées ({subjectLabel || 'Tous les cours'}) — <span className="text-primary">Survoler pour détails</span>
                      </TableHead>
                      <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">
                        Statut <span className="normal-case font-normal text-slate-300">(cliquer pour changer)</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-slate-400 font-bold italic">
                          {search ? 'Aucun étudiant ne correspond à votre recherche.' : 'Aucun étudiant trouvé dans cette classe.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => {
                        const record = attendance.find((a) => a.studentId === student.id);
                        const status = record?.status ?? 'PRESENT';
                        const fullName =
                          student.firstName && student.lastName
                            ? `${student.firstName} ${student.lastName}`
                            : student.username || student.name || `Étudiant #${student.id}`;
                        const activeCourseSummary = getActiveCourseSummaryForStudent(student.id);

                        return (
                          <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <TableCell className="pl-8 py-4">
                              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                #{student.userId || student.id}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                                  {(fullName[0] || 'U').toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-black text-slate-800 text-sm">{fullName}</p>
                                  {activeCourseSummary.absentCount >= EXPULSION_THRESHOLD && (
                                    <p className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                                      <AlertTriangle size={10} /> Risque d&apos;exclusion ({activeCourseSummary.absentCount} absences)
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <CourseAbsenceHoverBadge
                                summary={activeCourseSummary}
                                studentName={fullName}
                                compact={!!subjectLabel}
                              />
                            </TableCell>
                            <TableCell className="text-right pr-8 py-4">
                              <StatusButton status={status as AttendanceStatus} onChange={(s) => setStatus(student.id, s)} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Footer action bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-4">
            <div className="flex items-center gap-3 text-slate-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <UserCheck size={15} />
                <span className="text-sm font-bold">
                  {presentCount} sur {students.length} présents
                </span>
              </div>
              {subjectLabel && (
                <Badge
                  className={`border-none font-bold text-[10px] px-3 ${
                    isOtherSelected ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-primary'
                  }`}
                >
                  {isOtherSelected ? '📝 ' : '📚 '}
                  {subjectLabel}
                </Badge>
              )}
              {sessionTime && (
                <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-3">
                  🕐 {formatSessionTime(sessionTime)}
                </Badge>
              )}
            </div>
            <div className="flex gap-3">
              {isEditing && (
                <Button
                  variant="ghost"
                  className="rounded-xl font-bold text-slate-400 text-xs hover:text-rose-500"
                  onClick={cancelEdit}
                >
                  Annuler
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting || students.length === 0}
                className="h-12 px-8 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-lg gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isEditing ? 'Mettre à jour la séance' : 'Finaliser le registre'}
              </Button>
            </div>
          </div>
        </div>
      ) : view === 'tracker' ? (
        /* ═══ STUDENT & COURSE ABSENCE TRACKER VIEW ═════════════════════════ */
        <div className="space-y-6">
          {/* 4-Filter Control Bar: Class (already top), Subject, Student, Date, Status */}
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Filtrer les présences par Étudiant, Classe, Date et Matière
                </h3>
              </div>
              {(trackerStudentId !== 'all' || trackerSubject !== 'all' || trackerDate || trackerStatus !== 'all' || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTrackerStudentId('all');
                    setTrackerSubject('all');
                    setTrackerDate('');
                    setTrackerStatus('all');
                    setSearch('');
                  }}
                  className="text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-8 rounded-xl"
                >
                  <X size={12} className="mr-1" /> Réinitialiser les filtres
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Student Select */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Étudiant</label>
                <Select value={trackerStudentId} onValueChange={setTrackerStudentId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                    <SelectValue placeholder="Tous les étudiants" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64">
                    <SelectItem value="all" className="font-bold">Tous les étudiants ({students.length})</SelectItem>
                    {students.map((s) => {
                      const fn =
                        s.firstName && s.lastName
                          ? `${s.firstName} ${s.lastName}`
                          : s.username || s.name || `Étudiant #${s.id}`;
                      return (
                        <SelectItem key={s.id} value={String(s.id)} className="font-bold">
                          {fn} ({s.userId || s.id})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Select */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Matière / Cours</label>
                <Select value={trackerSubject} onValueChange={setTrackerSubject}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs">
                    <SelectValue placeholder="Toutes les matières" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64">
                    <SelectItem value="all" className="font-bold">Toutes les matières</SelectItem>
                    {availableCourseNames.map((name) => (
                      <SelectItem key={name} value={name} className="font-bold">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 h-11">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={trackerDate}
                    onChange={(e) => setTrackerDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-700 bg-transparent outline-none"
                  />
                  {trackerDate && (
                    <button type="button" onClick={() => setTrackerDate('')} className="text-slate-400 hover:text-rose-500">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Statut</label>
                <Select value={trackerStatus} onValueChange={setTrackerStatus}>
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

              {/* Search Student */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recherche rapide</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    placeholder="Nom ou ID étudiant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Matrix: Student Course Absence Summary with Hover Details */}
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-visible">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  Cumul des Absences par Étudiant & par Cours (Seuil d&apos;exclusion : {EXPULSION_THRESHOLD} absences)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Survolez chaque cours pour afficher les dates et heures exactes des absences soumises pour cet étudiant.
                </p>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-black text-[10px] uppercase px-3 py-1">
                {trackerStudentRows.filter((r) => r.maxCourseAbsences >= EXPULSION_THRESHOLD).length} Étudiant(s) en risque d&apos;exclusion
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
                      Absences par Matière (Survoler pour voir Date & Heure de chaque absence)
                    </TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Total Absences
                    </TableHead>
                    <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Statut Disciplinaire
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackerStudentRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-14 text-slate-400 font-bold">
                        Aucun étudiant trouvé pour ces critères.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trackerStudentRows.map(({ student, fullName, courseSummaries, totalAbsences, maxCourseAbsences }) => {
                      const isExpulsionRisk = maxCourseAbsences >= EXPULSION_THRESHOLD;
                      const isWatch = maxCourseAbsences === EXPULSION_THRESHOLD - 1;
                      return (
                        <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/50">
                          <TableCell className="pl-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                                {(fullName[0] || 'E').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{fullName}</p>
                                <p className="font-mono text-[10px] font-bold text-slate-400">#{student.userId || student.id}</p>
                              </div>
                            </div>
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
                                    studentName={fullName}
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
                            {isExpulsionRisk ? (
                              <Badge className="bg-rose-600 text-white border-none font-black text-[9px] uppercase px-3 py-1 gap-1">
                                <AlertTriangle size={11} /> Risque d&apos;exclusion ({maxCourseAbsences} abs.)
                              </Badge>
                            ) : isWatch ? (
                              <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[9px] uppercase px-3 py-1">
                                Avertissement ({maxCourseAbsences}/{EXPULSION_THRESHOLD})
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

          {/* Detailed Chronological Records Table */}
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-visible">
            <CardHeader className="border-b border-slate-50 px-8 py-5 flex flex-row items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Journal Détaillé des Séances & Présences ({trackerFlatRecords.length})
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Chaque ligne affiche la date, l&apos;heure, la matière, l&apos;étudiant et le cumul d&apos;absences du cours
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
                      Matière / Cours
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Étudiant
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Cumul Absences Cours (Survoler)
                    </TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Statut Séance
                    </TableHead>
                    <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackerFlatRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-14 text-slate-400 font-bold">
                        Aucun enregistrement de présence ne correspond aux filtres sélectionnés.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trackerFlatRecords.map((row, idx) => {
                      const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.ABSENT;
                      return (
                        <TableRow key={`${row.sessionId}-${row.studentId}-${idx}`} className="border-slate-50 hover:bg-slate-50/60">
                          <TableCell className="pl-8 py-3.5">
                            <p className="font-black text-slate-800 text-xs">{formatDateFr(row.date)}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-primary" /> {row.time}
                            </p>
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
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${cfg.bg} ${cfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSession(row.session)}
                              className="text-xs font-bold text-primary hover:bg-blue-50 rounded-xl"
                            >
                              ✎ Modifier
                            </Button>
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
      ) : (
        /* ═══ HISTORY VIEW ════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">
              {history.length} Séance{history.length !== 1 ? 's' : ''} enregistrée{history.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
              <ShieldCheck size={36} className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Aucune séance enregistrée.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {history.map((session, idx) => {
                const rate =
                  session.totalCount > 0
                    ? Math.round(((session.presentCount + session.lateCount) / session.totalCount) * 100)
                    : 0;
                const timeDisplay = formatSessionTime(session.sessionTime, session.createdAt);
                const eventLabel = session.notes || session.subjectName || 'Séance générale';
                const isOtherEvent = !!session.notes;

                return (
                  <Card
                    key={session.id}
                    className="border border-slate-100 hover:border-primary/40 duration-200 transition-all shadow-sm rounded-2xl bg-white p-4 group hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <Calendar size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              rate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {rate}%
                          </span>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-wider mt-0.5">
                            Séance #{idx + 1}
                          </p>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 tracking-tight mb-2">
                        {formatDateFr(session.date)}
                      </h4>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isOtherEvent ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isOtherEvent ? <FileEdit size={9} /> : <BookOpen size={9} />}
                          <span className="truncate max-w-[130px]">{eventLabel}</span>
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                          <Clock size={9} /> {timeDisplay}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3 text-[10px] font-black">
                        <span className="text-emerald-600">{session.presentCount} Présents</span>
                        <span className="text-rose-600">{session.absentCount} Absents</span>
                        {session.lateCount > 0 && <span className="text-amber-600">{session.lateCount} Retards</span>}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSession(session)}
                      className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-9 border-slate-200 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      ✎ Modifier la séance
                    </Button>
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
