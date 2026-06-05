/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
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
  ShieldCheck, BookOpen, FileEdit,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

interface Student {
  id: number;
  name: string;
  username?: string;
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
  subjectName: string | null;
  subjectId: number | null;
  notes: string | null;
  totalCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  records: { studentId: number; studentName: string; status: string }[];
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; dot: string }> = {
  PRESENT: { label: 'Present',  bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ABSENT:  { label: 'Absent',   bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    dot: 'bg-rose-500'   },
  LATE:    { label: 'Late',     bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500'  },
  EXCUSED: { label: 'Excused',  bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',    dot: 'bg-blue-500'   },
  SICK:    { label: 'Sick',     bg: 'bg-purple-50 border-purple-200',   text: 'text-purple-700',  dot: 'bg-purple-500' },
};

const STATUS_CYCLE: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];

function StatusButton({ status, onChange }: { status: AttendanceStatus; onChange: (s: AttendanceStatus) => void }) {
  const cfg = STATUS_CONFIG[status];
  const next = () => onChange(STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length]);
  return (
    <button
      onClick={next}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-[10px] uppercase tracking-widest transition-all duration-200 hover:shadow-sm active:scale-95 ${cfg.bg} ${cfg.text}`}
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

// ═════════════════════════════════════════════════════════════════════════════
export default function TeacherAttendancePage() {
  const [classes, setClasses]                   = useState<any[]>([]);
  const [students, setStudents]                 = useState<Student[]>([]);
  const [subjects, setSubjects]                 = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass]       = useState<string>('');
  const [selectedSubject, setSelectedSubject]   = useState<string>('');  // 'none' | 'other' | '<id>'
  const [otherNote, setOtherNote]               = useState<string>('');  // custom text when "other"
  const [sessionTime, setSessionTime]           = useState<string>('');
  const [attendance, setAttendance]             = useState<AttendanceRecord[]>([]);
  const [view, setView]                         = useState<'mark' | 'history'>('mark');
  const [history, setHistory]                   = useState<HistorySession[]>([]);
  const [search, setSearch]                     = useState('');
  const [sessionDate, setSessionDate]           = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing]               = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting]             = useState(false);
  const [loadingStudents, setLoadingStudents]   = useState(false);
  const [loadingSubjects, setLoadingSubjects]   = useState(false);

  const isOtherSelected = selectedSubject === 'other';

  // ── Load classes on mount ───────────────────────────────────────────────────
  useEffect(() => {
    api.get('/teacher/classes')
      .then(r => setClasses(r.data))
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  // ── Filtered students ───────────────────────────────────────────────────────
  const filteredStudents = useMemo(
    () => students.filter(s => {
      const q = search.toLowerCase();
      return (s.username || s.name || '').toLowerCase().includes(q)
          || (s.userId || '').toLowerCase().includes(q);
    }),
    [students, search]
  );

  // ── Live analytics ──────────────────────────────────────────────────────────
  const presentCount  = attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount   = attendance.filter(a => a.status === 'ABSENT').length;
  const lateCount     = attendance.filter(a => a.status === 'LATE').length;
  const excusedCount  = attendance.filter(a => a.status === 'EXCUSED' || a.status === 'SICK').length;
  const attendanceRate = students.length > 0
    ? Math.round(((presentCount + lateCount) / students.length) * 100) : 0;

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const r = await api.get(`/teacher/classes/${classId}/students`);
      setStudents(r.data);
      setAttendance(r.data.map((s: Student) => ({ studentId: s.id, status: 'PRESENT' as AttendanceStatus })));
    } catch { toast.error('Failed to fetch students'); }
    finally { setLoadingStudents(false); }
  };

  const fetchSubjects = async (classId: string) => {
    setLoadingSubjects(true);
    try {
      // Use the class-specific endpoint (now returns all subjects sorted alphabetically)
      const r = await api.get(`/teacher/classes/${classId}/subjects`);
      setSubjects(Array.isArray(r.data) ? r.data : []);
    } catch {
      // Fallback: try the general teacher subjects endpoint
      try {
        const r2 = await api.get('/teacher/subjects');
        setSubjects(Array.isArray(r2.data) ? r2.data : []);
      } catch {
        setSubjects([]);
        toast.error('Could not load subjects — you can still use "Other"');
      }
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchHistory = async (classId: string) => {
    try {
      const r = await api.get(`/teacher/classes/${classId}/attendance-history`);
      setHistory(r.data);
    } catch { toast.error('Failed to load attendance history'); }
  };

  // ── Class selection ─────────────────────────────────────────────────────────
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedSubject('');
    setOtherNote('');
    setSessionTime('');
    setIsEditing(false);
    setCurrentSessionId(null);
    setSearch('');
    if (view === 'mark') {
      fetchStudents(classId);
      fetchSubjects(classId);
    } else {
      fetchHistory(classId);
    }
  };

  // ── Status helpers ──────────────────────────────────────────────────────────
  const setStatus = (studentId: number, status: AttendanceStatus) =>
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));

  const markAll = (status: AttendanceStatus) =>
    setAttendance(prev => prev.map(a => ({ ...a, status })));

  // ── Submit / Update ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedClass) return toast.error('Please select a class first.');
    if (students.length === 0) return toast.error('No students loaded for this class.');
    if (isOtherSelected && !otherNote.trim()) return toast.error('Please enter the event name for "Other".');

    setSubmitting(true);
    const tid = toast.loading(isEditing ? 'Updating session...' : 'Saving attendance...');

    const payload: any = {
      classId: parseInt(selectedClass),
      date: sessionDate,
      records: attendance.map(a => ({ studentId: a.studentId, status: a.status })),
    };
    if (sessionTime) payload.sessionTime = sessionTime;
    // Subject: regular relation OR "other" custom note
    if (selectedSubject && selectedSubject !== 'none' && !isOtherSelected) {
      payload.subjectId = parseInt(selectedSubject);
    }
    if (isOtherSelected && otherNote.trim()) {
      payload.notes = otherNote.trim();
    }

    try {
      if (isEditing && currentSessionId) {
        await api.put(`/teacher/attendance/${currentSessionId}`, payload);
        toast.success('Session updated ✓', { id: tid });
        setIsEditing(false);
        setCurrentSessionId(null);
        setView('history');
        fetchHistory(selectedClass);
      } else {
        await api.post('/teacher/attendance', payload);
        toast.success('Attendance saved ✓', { id: tid });
        // Reset session form
        setAttendance(students.map(s => ({ studentId: s.id, status: 'PRESENT' as AttendanceStatus })));
        setSessionDate(new Date().toISOString().split('T')[0]);
        setSessionTime('');
        setSelectedSubject('');
        setOtherNote('');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message
        || error?.response?.data?.error
        || 'Sync failed — check connection';
      toast.error(String(msg), { id: tid });
      console.error('Attendance submit error:', error?.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit session ────────────────────────────────────────────────────────────
  const handleEditSession = async (session: HistorySession) => {
    const tid = toast.loading('Loading session for editing...');
    try {
      setIsEditing(true);
      setCurrentSessionId(session.id);
      setSessionDate(session.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setSessionTime(session.sessionTime || '');

      // Restore subject / other
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
      const fetched: Student[] = r.data;
      setStudents(fetched);

      const statusMap = new Map<number, AttendanceStatus>();
      for (const rec of session.records) {
        if (rec.studentId) statusMap.set(rec.studentId, rec.status as AttendanceStatus);
      }
      setAttendance(fetched.map(s => ({ studentId: s.id, status: statusMap.get(s.id) ?? 'ABSENT' })));

      setView('mark');
      toast.success('Session loaded — make your changes', { id: tid });
    } catch (err) {
      toast.error('Failed to load session details', { id: tid });
      console.error(err);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentSessionId(null);
    setSessionTime('');
    setSelectedSubject('');
    setOtherNote('');
    setView('history');
  };

  // ── Subject display label ───────────────────────────────────────────────────
  const subjectLabel = isOtherSelected
    ? (otherNote || 'Other Event')
    : (subjects.find(s => String(s.id) === selectedSubject)?.name || null);

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-6 bg-[#f8fafc]">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck size={15} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Attendance</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,2.5rem)] font-black tracking-tighter text-slate-900 italic">
            Academic <span className="text-primary">Registry.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <Calendar size={10} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="w-full md:w-[240px] h-12 rounded-2xl bg-white shadow-sm font-black text-[10px] uppercase tracking-widest border-slate-100 hover:border-primary transition-colors duration-300">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            {classes.map(c => (
              <SelectItem key={c.id} value={String(c.id)} className="font-bold">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── View tabs ── */}
      {selectedClass && (
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => {
              if (view !== 'mark' && !isEditing) {
                setView('mark');
                fetchStudents(selectedClass);
                fetchSubjects(selectedClass);
              }
            }}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all ${
              view === 'mark' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <PlusCircle size={13} /> {isEditing ? '✎ Editing Session' : 'New Session'}
          </Button>
          <Button
            onClick={() => { setView('history'); fetchHistory(selectedClass); }}
            className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all ${
              view === 'history' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            <History size={13} /> View History
          </Button>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══════════════════════════════════════════════════════ */}
      {!selectedClass ? (
        <div className="h-[500px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-primary/40 transition-colors duration-500">
          <div className="p-8 bg-slate-50 rounded-3xl mb-6">
            <Users size={64} className="text-slate-200" />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Select a Class</h2>
          <p className="text-slate-400 text-sm font-medium mt-2 text-center max-w-xs">
            Choose a class from the dropdown above to begin managing attendance.
          </p>
        </div>

      ) : view === 'mark' ? (
        /* ═══ MARK SESSION VIEW ════════════════════════════════════════════ */
        <div className="space-y-5">

          {/* Live analytics bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-6">
                <StatPill label="Total"   value={students.length} color="text-slate-900" />
                <StatPill label="Present" value={presentCount}    color="text-emerald-600" />
                <StatPill label="Absent"  value={absentCount}     color="text-rose-600" />
                <StatPill label="Late"    value={lateCount}       color="text-amber-600" />
                <StatPill label="Excused" value={excusedCount}    color="text-blue-600" />
              </div>
              <div className="flex items-center gap-3 min-w-[160px]">
                <span className={`text-2xl font-black ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {attendanceRate}%
                </span>
                <div className="flex-1">
                  <Progress value={attendanceRate} className="h-2 rounded-full bg-slate-100" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 space-y-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Session Details</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Calendar size={10} /> Date
                </label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-4 h-11">
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={10} /> Subject
                  {loadingSubjects && <Loader2 size={10} className="animate-spin text-primary" />}
                </label>
                <Select value={selectedSubject} onValueChange={v => { setSelectedSubject(v); setOtherNote(''); }}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-sm hover:border-primary transition-colors">
                    <SelectValue placeholder={loadingSubjects ? 'Loading subjects...' : 'Select subject'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-64 overflow-y-auto">
                    <SelectItem value="none" className="font-bold text-slate-400 italic">
                      No subject
                    </SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={String(s.id)} className="font-bold">
                        {s.name}{s.code ? ` (${s.code})` : ''}
                      </SelectItem>
                    ))}
                    {/* Divider + Other option */}
                    <div className="border-t border-slate-100 my-1" />
                    <SelectItem value="other" className="font-black text-primary flex items-center gap-2">
                      <span className="flex items-center gap-2">
                        <FileEdit size={12} className="text-primary" /> Other / Custom Event
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Time */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Clock size={10} /> Session Time
                </label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-4 h-11 hover:border-primary transition-colors">
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={e => setSessionTime(e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-transparent outline-none"
                  />
                </div>
                {sessionTime && (
                  <p className="text-[9px] font-bold text-primary pl-1">
                    {new Date(`2000-01-01T${sessionTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            {/* "Other" custom event input — shows when "other" is selected */}
            {isOtherSelected && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <FileEdit size={10} /> Describe the Event / Missed Activity
                </label>
                <div className="flex items-start gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="e.g. Sports Day, School Ceremony, Field Trip, National Holiday..."
                      value={otherNote}
                      onChange={e => setOtherNote(e.target.value)}
                      className="h-11 rounded-xl bg-amber-50 border-amber-200 font-bold text-sm placeholder:text-amber-300 focus:border-primary"
                      autoFocus
                    />
                    {otherNote && (
                      <button
                        onClick={() => setOtherNote('')}
                        className="absolute right-3 top-3 text-slate-300 hover:text-slate-500"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {otherNote && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-black text-[10px] px-3 py-1 h-11 flex items-center rounded-xl">
                      Custom Event
                    </Badge>
                  )}
                </div>
                <p className="text-[9px] font-bold text-amber-500 pl-1">
                  This will be recorded as the session reason — visible to students and admin.
                </p>
              </div>
            )}
          </div>

          {/* Search + bulk actions */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
              <Input
                placeholder="Search student..."
                className="pl-9 h-11 rounded-xl bg-white border-slate-100 font-bold text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap ml-auto">
              <Button size="sm" variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                onClick={() => markAll('PRESENT')}>
                <CheckCheck size={12} /> All Present
              </Button>
              <Button size="sm" variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                onClick={() => markAll('ABSENT')}>
                <X size={12} /> All Absent
              </Button>
              <Button size="sm" variant="outline"
                className="rounded-xl gap-1.5 font-bold text-[11px] border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                onClick={() => markAll('LATE')}>
                <Clock size={12} /> All Late
              </Button>
            </div>
          </div>

          {/* Student Registry Table */}
          <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="border-b border-slate-50 px-8 py-4 flex flex-row items-center justify-between bg-white">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Class Registry</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {loadingStudents ? 'Loading...' : `${students.length} students enrolled`}
                </p>
              </div>
              <Badge className={`font-black px-4 py-1 rounded-full uppercase text-[9px] border-none ${isEditing ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-primary'}`}>
                {isEditing ? '✎ Edit Mode' : '+ New Session'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[52vh] overflow-y-auto">
              {loadingStudents ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400 w-[140px]">Student ID</TableHead>
                      <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Full Name</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">
                        Status <span className="normal-case font-normal text-slate-300">(click to change)</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-16 text-slate-400 font-bold italic">
                          {search ? 'No students match your search.' : 'No students found in this class.'}
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.map(student => {
                      const record = attendance.find(a => a.studentId === student.id);
                      const status = record?.status ?? 'PRESENT';
                      return (
                        <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/60 transition-colors">
                          <TableCell className="pl-8 py-4">
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              #{student.userId || student.id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                                {(student.username || student.name || 'U')[0].toUpperCase()}
                              </div>
                              <p className="font-black text-slate-800 text-sm capitalize">
                                {student.username || student.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8 py-4">
                            <StatusButton
                              status={status as AttendanceStatus}
                              onChange={s => setStatus(student.id, s)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                <span className="text-sm font-bold">{presentCount} of {students.length} present</span>
              </div>
              {subjectLabel && (
                <Badge className={`border-none font-bold text-[10px] px-3 ${isOtherSelected ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-primary'}`}>
                  {isOtherSelected ? '📝 ' : '📚 '}{subjectLabel}
                </Badge>
              )}
              {sessionTime && (
                <Badge className="bg-slate-50 text-slate-600 border-none font-bold text-[10px] px-3">
                  🕐 {new Date(`2000-01-01T${sessionTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              )}
            </div>
            <div className="flex gap-3">
              {isEditing && (
                <Button variant="ghost"
                  className="rounded-xl font-bold text-slate-400 text-xs hover:text-rose-500"
                  onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting || students.length === 0}
                className="h-12 px-8 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-lg gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isEditing ? 'Update Session' : 'Finalize Registry'}
              </Button>
            </div>
          </div>
        </div>

      ) : (
        /* ═══ HISTORY VIEW ════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">
              {history.length} Session{history.length !== 1 ? 's' : ''} Recorded
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
              <ShieldCheck size={36} className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No sessions recorded yet.</p>
            </div>
          ) : (
            <div
            className="overflow-y-auto pr-1"
            style={{ maxHeight: '488px' }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {history.map((session, idx) => {
                const rate = session.totalCount > 0
                  ? Math.round(((session.presentCount + session.lateCount) / session.totalCount) * 100) : 0;
                const timeDisplay = session.sessionTime
                  ? new Date(`2000-01-01T${session.sessionTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : null;
                const eventLabel = session.notes || session.subjectName;
                const isOtherEvent = !!session.notes;

                return (
                  <Card key={session.id} className="border border-slate-100 hover:border-primary/40 duration-200 transition-all shadow-sm rounded-2xl bg-white p-3 group hover:shadow-md">
                    {/* Top row: icon + rate */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors flex-shrink-0">
                        <Calendar size={15} className="text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {rate}%
                        </span>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-wider mt-0.5">#{idx + 1}</p>
                      </div>
                    </div>

                    {/* Date */}
                    <h4 className="text-[11px] font-black text-slate-900 tracking-tight leading-tight mb-1">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h4>

                    {/* Subject / Event + Time badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {eventLabel && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 max-w-full ${isOtherEvent ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                          {isOtherEvent ? <FileEdit size={7} /> : <BookOpen size={7} />}
                          <span className="truncate max-w-[80px]">{eventLabel}</span>
                        </span>
                      )}
                      {timeDisplay && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-0.5">
                          <Clock size={7} /> {timeDisplay}
                        </span>
                      )}
                    </div>

                    {/* Stats row — abbreviated */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[8px] font-black text-slate-500 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{session.presentCount}P
                      </span>
                      <span className="text-[8px] font-black text-slate-500 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />{session.absentCount}A
                      </span>
                      {session.lateCount > 0 && (
                        <span className="text-[8px] font-black text-slate-500 flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{session.lateCount}L
                        </span>
                      )}
                      {session.excusedCount > 0 && (
                        <span className="text-[8px] font-black text-slate-500 flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{session.excusedCount}E
                        </span>
                      )}
                    </div>

                    <Progress value={rate} className="h-1 mb-2 bg-slate-100" />

                    <Button
                      className="w-full h-7 rounded-lg bg-slate-900 text-white font-black text-[8px] uppercase tracking-widest hover:bg-primary transition-all"
                      onClick={() => handleEditSession(session)}
                    >
                      Modify
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
  );
}
