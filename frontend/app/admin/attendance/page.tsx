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
  ClipboardList, BarChart2, Trash2, ShieldAlert, TrendingUp, RefreshCw, BookOpen, FileEdit, X,
} from 'lucide-react';
import api from '@/lib/api';

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
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Present' },
  ABSENT:  { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Absent'  },
  LATE:    { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Late'    },
  EXCUSED: { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Excused' },
  SICK:    { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Sick'    },
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
      toast.error('Failed to load attendance data');
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
    if (!confirm('Delete this session? All student records for this session will also be deleted.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/attendance/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Attendance Data...</p>
      </div>
    );
  }

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
            Attendance <span className="text-primary">Control.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
            School-wide attendance visibility &amp; management
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 rounded-2xl gap-2 font-bold text-sm border-slate-200 hover:border-primary"
          onClick={fetchData}
        >
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3">
        <Button
          onClick={() => setTab('analytics')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all ${
            tab === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <BarChart2 size={13} /> Analytics
        </Button>
        <Button
          onClick={() => setTab('sessions')}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all ${
            tab === 'sessions' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <ClipboardList size={13} /> All Sessions
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">School-Wide Attendance Rate</p>
                  <h2 className={`text-7xl font-black italic tracking-tighter mt-1 ${analytics.overallRate >= 75 ? 'text-white' : 'text-rose-400'}`}>
                    {analytics.overallRate}%
                  </h2>
                </div>
                <Badge className="bg-primary/20 text-blue-400 border-none font-black px-4 py-1 uppercase text-[9px]">
                  {analytics.totalRecords} Total Records
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Overall Attendance</span>
                  <span className={analytics.overallRate >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                    {analytics.presentCount + analytics.lateCount} / {analytics.totalRecords} Present
                  </span>
                </div>
                <Progress value={analytics.overallRate} className="h-2.5 bg-white/10" />
              </div>
              <TrendingUp size={180} className="absolute -right-10 -bottom-10 text-white/5" />
            </CardContent>
          </Card>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Present"       value={analytics.presentCount}  icon={CheckCircle2} color="border-emerald-100 hover:border-emerald-300" />
            <StatCard label="Absent"        value={analytics.absentCount}   icon={XCircle}      color="border-rose-100 hover:border-rose-300"     />
            <StatCard label="Late"          value={analytics.lateCount}     icon={Clock}        color="border-amber-100 hover:border-amber-300"    />
            <StatCard label="Excused/Sick"  value={analytics.excusedCount}  icon={ShieldAlert}  color="border-blue-100 hover:border-blue-300"     />
          </div>

          {/* Per-class breakdown */}
          {analytics.byClass.length > 0 && (
            <Card className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="border-b border-slate-50 px-8 py-5">
                <p className="font-black text-xs uppercase tracking-widest text-slate-900">Attendance by Class</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Class</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Total</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Present</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">Late</TableHead>
                      <TableHead className="pr-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Rate</TableHead>
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
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all" className="font-bold">All Classes</SelectItem>
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
                placeholder="Filter by date"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-slate-300 hover:text-rose-400 transition-colors ml-1"
                  title="Clear date filter"
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
                className="h-11 rounded-2xl font-bold text-[11px] text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-4"
                onClick={() => { setClassFilter('all'); setDateFilter(''); }}
              >
                <X size={12} className="mr-1" /> Clear Filters
              </Button>
            )}

            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-auto">
              {filtered.length} session{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Sessions scrollable list — shows ~5 rows, rest scrollable */}
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
              <Users size={40} className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">
                {dateFilter || classFilter !== 'all' ? 'No sessions match your filters.' : 'No sessions found.'}
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
                            {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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
                                {new Date(`2000-01-01T${session.sessionTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex gap-4">
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />{session.presentCount} Present
                          </span>
                          <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />{session.absentCount} Absent
                          </span>
                          {session.lateCount > 0 && (
                            <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />{session.lateCount} Late
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-black px-3 py-1 rounded-full ${session.attendanceRate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {session.attendanceRate}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2"
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
                              <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-slate-400">Student</TableHead>
                              <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">ID</TableHead>
                              <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.records.map((rec, i) => {
                              const style = STATUS_STYLE[rec.status] || STATUS_STYLE['ABSENT'];
                              return (
                                <TableRow key={i} className="border-slate-50 hover:bg-white/60">
                                  <TableCell className="pl-8 py-3 font-bold text-slate-800 text-sm capitalize">
                                    {rec.studentName || 'Unknown'}
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
