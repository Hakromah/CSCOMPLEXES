'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Mail,
  Phone,
  Search,
  Loader2,
  Sparkles,
  School,
  CheckCircle2,
  User,
  Layers,
  Printer,
  ChevronRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number | null;
  initialClass?: {
    id: number;
    name: string;
    grade?: string;
    academicYear?: any;
    students?: any[];
    teachers?: any[];
  } | null;
  locale?: 'fr' | 'en';
}

interface StudentItem {
  id: number;
  userId?: string;
  username?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  birthCity?: string;
  birthDate?: string;
  address?: string;
  schoolRole?: string;
}

interface TeacherCourse {
  id: number;
  name: string;
  code?: string | null;
}

interface TeacherItem {
  id: number;
  userId?: string;
  username?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  subjects?: TeacherCourse[];
  sessionsCount?: number;
}

interface TimetableItem {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  periodName?: string;
  lessonType?: string;
  status?: string;
  roomName?: string;
  subject?: { id: number; name: string; code?: string | null };
  teacher?: { id: number; username?: string; name?: string; userId?: string };
  room?: { id: number; name: string; code?: string; building?: string };
  academicYear?: { id: number; name: string };
  semester?: { id: number; name: string };
}

interface ClassOverviewData {
  class: {
    id: number;
    name: string;
    grade?: string;
    academicYear?: any;
  };
  students: StudentItem[];
  teachers: TeacherItem[];
  timetable: TimetableItem[];
}

const DAYS_FR: Record<string, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
};

const DAYS_EN: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const DAY_ORDER: string[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function ClassDetailModal({
  isOpen,
  onClose,
  classId,
  initialClass,
  locale = 'fr',
}: ClassDetailModalProps) {
  const isFr = locale === 'fr';

  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'timetable'>('students');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ClassOverviewData | null>(null);

  // Search & Filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  const fetchOverview = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/classes/${id}/overview`);
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load class overview from /admin/classes/:id/overview', err);
      // Fallback: try fallback composition using initialClass
      if (initialClass) {
        try {
          const ttRes = await api.get(`/admin/timetables?classId=${id}`);
          const timetable: TimetableItem[] = Array.isArray(ttRes.data) ? ttRes.data : [];
          
          // Map teachers from initialClass and timetable
          const teacherMap = new Map<number, TeacherItem>();
          (initialClass.teachers || []).forEach((t: any) => {
            teacherMap.set(t.id, {
              id: t.id,
              userId: t.userId,
              username: t.username,
              name: t.name || t.username,
              email: t.email,
              phoneNumber: t.phoneNumber,
              gender: t.gender,
              subjects: [],
              sessionsCount: 0,
            });
          });

          timetable.forEach((entry: any) => {
            if (!entry.teacher?.id) return;
            let t = teacherMap.get(entry.teacher.id);
            if (!t) {
              t = {
                id: entry.teacher.id,
                userId: entry.teacher.userId,
                username: entry.teacher.username,
                name: entry.teacher.name || entry.teacher.username,
                email: entry.teacher.email,
                phoneNumber: entry.teacher.phoneNumber,
                subjects: [],
                sessionsCount: 0,
              };
              teacherMap.set(entry.teacher.id, t);
            }
            t.sessionsCount = (t.sessionsCount || 0) + 1;
            if (entry.subject?.id && !t.subjects?.some(s => s.id === entry.subject.id)) {
              t.subjects = [...(t.subjects || []), { id: entry.subject.id, name: entry.subject.name, code: entry.subject.code }];
            }
          });

          setData({
            class: {
              id: initialClass.id,
              name: initialClass.name,
              grade: initialClass.grade,
              academicYear: initialClass.academicYear,
            },
            students: initialClass.students || [],
            teachers: Array.from(teacherMap.values()),
            timetable,
          });
        } catch {
          // Empty fallback
          setData({
            class: {
              id: initialClass.id,
              name: initialClass.name,
              grade: initialClass.grade,
            },
            students: initialClass.students || [],
            teachers: initialClass.teachers || [],
            timetable: [],
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [initialClass]);

  useEffect(() => {
    if (isOpen && classId) {
      setStudentSearch('');
      setTeacherSearch('');
      setSelectedDay('ALL');
      fetchOverview(classId);
    } else if (!isOpen) {
      setData(null);
    }
  }, [isOpen, classId, fetchOverview]);

  // Derived filtered students
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    const q = studentSearch.trim().toLowerCase();
    if (!q) return data.students;
    return data.students.filter(s =>
      (s.username || s.name || '').toLowerCase().includes(q) ||
      (s.userId || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phoneNumber || '').toLowerCase().includes(q)
    );
  }, [data?.students, studentSearch]);

  // Derived filtered teachers
  const filteredTeachers = useMemo(() => {
    if (!data?.teachers) return [];
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return data.teachers;
    return data.teachers.filter(t =>
      (t.username || t.name || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.userId || '').toLowerCase().includes(q) ||
      (t.subjects || []).some(sub => sub.name.toLowerCase().includes(q))
    );
  }, [data?.teachers, teacherSearch]);

  // Derived filtered timetable
  const filteredTimetable = useMemo(() => {
    if (!data?.timetable) return [];
    let list = [...data.timetable];
    if (selectedDay !== 'ALL') {
      list = list.filter(item => item.dayOfWeek === selectedDay);
    }
    // Sort by day order then startTime
    return list.sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [data?.timetable, selectedDay]);

  // Helper for formatting time (08:00:00 -> 08:00)
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  // Helper for printing timetable
  const handlePrintTimetable = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const className = data?.class?.name || 'Classe';
    const yearName = data?.class?.academicYear?.name || '';
    const dayLabels = isFr ? DAYS_FR : DAYS_EN;

    const rows = filteredTimetable.map(item => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${dayLabels[item.dayOfWeek] || item.dayOfWeek}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${formatTime(item.startTime)} - ${formatTime(item.endTime)}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${item.subject?.name || 'Matière'}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.teacher?.name || item.teacher?.username || '-'}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.room?.name || item.roomName || 'Salle standard'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${isFr ? 'Emploi du Temps' : 'Class Timetable'} - ${className}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; }
            h1 { margin: 0 0 4px 0; font-size: 24px; text-transform: uppercase; }
            p { margin: 0 0 20px 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px; }
            th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${isFr ? 'Emploi du Temps Officiel' : 'Official Class Timetable'} - ${className}</h1>
          <p>${yearName ? `${isFr ? 'Année Académique' : 'Academic Year'}: ${yearName} • ` : ''}${isFr ? 'Document généré le' : 'Generated on'} ${new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</p>
          <table>
            <thead>
              <tr>
                <th>${isFr ? 'Jour' : 'Day'}</th>
                <th>${isFr ? 'Horaire' : 'Time'}</th>
                <th>${isFr ? 'Matière / Cours' : 'Subject / Course'}</th>
                <th>${isFr ? 'Enseignant' : 'Teacher'}</th>
                <th>${isFr ? 'Salle' : 'Room'}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const className = data?.class?.name || initialClass?.name || (isFr ? 'Détails de la Classe' : 'Class Details');
  const gradeLabel = data?.class?.grade || initialClass?.grade;
  const academicYearLabel = data?.class?.academicYear?.name || initialClass?.academicYear?.name;

  const totalStudents = data?.students?.length ?? (initialClass?.students?.length ?? 0);
  const totalTeachers = data?.teachers?.length ?? (initialClass?.teachers?.length ?? 0);
  const totalTimetable = data?.timetable?.length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl p-0 border-none shadow-2xl rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-[#F8FAFC] max-h-[90vh] flex flex-col focus:outline-none">
        
        {/* MODAL HERO HEADER */}
        <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 flex-shrink-0 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-400/20">
                  <School className="w-3 h-3 text-blue-400" />
                  {isFr ? 'Unité Pédagogique' : 'Academic Class Unit'}
                </span>
                {gradeLabel && (
                  <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5">
                    {isFr ? `Niveau ${gradeLabel}` : `Grade ${gradeLabel}`}
                  </Badge>
                )}
                {academicYearLabel && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/20 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5">
                    {academicYearLabel}
                  </Badge>
                )}
              </div>

              <DialogTitle className="text-2xl sm:text-4xl font-black italic tracking-tight text-white uppercase flex items-center gap-2">
                {className} <span className="text-blue-500">.</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
                {isFr
                  ? 'Fiche de cohorte complète : effectif des élèves, corps enseignant, cours assurés et emploi du temps.'
                  : 'Complete class cohort profile: enrolled students, assigned teachers, teaching courses, and weekly timetable.'}
              </DialogDescription>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 p-2 sm:p-3 rounded-2xl backdrop-blur-md">
              <div className="text-center px-2 sm:px-3 border-r border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isFr ? 'Élèves' : 'Students'}
                </p>
                <p className="text-lg sm:text-xl font-black text-white">{totalStudents}</p>
              </div>
              <div className="text-center px-2 sm:px-3 border-r border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isFr ? 'Profs' : 'Teachers'}
                </p>
                <p className="text-lg sm:text-xl font-black text-blue-400">{totalTeachers}</p>
              </div>
              <div className="text-center px-2 sm:px-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isFr ? 'Séances' : 'Sessions'}
                </p>
                <p className="text-lg sm:text-xl font-black text-emerald-400">{totalTimetable}</p>
              </div>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users size={14} />
              {isFr ? `Élèves Inscrits (${totalStudents})` : `Students (${totalStudents})`}
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'teachers'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <GraduationCap size={14} />
              {isFr ? `Enseignants & Matières (${totalTeachers})` : `Teachers & Courses (${totalTeachers})`}
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'timetable'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar size={14} />
              {isFr ? `Emploi du Temps (${totalTimetable})` : `Timetable (${totalTimetable})`}
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
                {isFr ? 'Chargement de la structure de classe...' : 'Loading class structure...'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: ENROLLED STUDENTS */}
              {activeTab === 'students' && (
                <motion.div
                  key="tab-students"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder={isFr ? 'Rechercher par nom, matricule, email...' : 'Search by name, ID, email...'}
                        className="h-11 pl-10 pr-4 rounded-2xl bg-white border-slate-200 text-xs font-bold shadow-sm focus-visible:ring-blue-600"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        {isFr ? `${filteredStudents.length} élèves affichés` : `${filteredStudents.length} students shown`}
                      </span>
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                        <Users size={28} />
                      </div>
                      <h4 className="text-base font-black text-slate-700">
                        {isFr ? 'Aucun élève trouvé' : 'No students found'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        {isFr
                          ? studentSearch
                            ? 'Aucun élève ne correspond aux critères de recherche.'
                            : 'Aucun élève n\'a encore été affecté à cette classe.'
                          : studentSearch
                            ? 'No student matches your search term.'
                            : 'No students have been assigned to this class yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {filteredStudents.map((student) => {
                        const displayName = student.name || student.username || 'Élève';
                        const initials = displayName
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase() || 'ST';

                        const isMale = student.gender?.toLowerCase() === 'male' || student.gender?.toLowerCase() === 'masculin';
                        const isFemale = student.gender?.toLowerCase() === 'female' || student.gender?.toLowerCase() === 'feminin';

                        return (
                          <div
                            key={student.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex items-start gap-3.5 group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-700 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                              {initials}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-black text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                  {displayName}
                                </h4>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider border border-emerald-200">
                                  {isFr ? 'Inscrit' : 'Enrolled'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {student.userId && (
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    #{student.userId}
                                  </span>
                                )}
                                {(isMale || isFemale) && (
                                  <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 border-slate-200 text-slate-500">
                                    {isFr ? (isMale ? 'Masculin' : 'Féminin') : (isMale ? 'Male' : 'Female')}
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500 font-medium">
                                {student.email && (
                                  <a
                                    href={`mailto:${student.email}`}
                                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors truncate"
                                  >
                                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{student.email}</span>
                                  </a>
                                )}
                                {student.phoneNumber && (
                                  <a
                                    href={`tel:${student.phoneNumber}`}
                                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                                  >
                                    <Phone size={12} className="text-slate-400 flex-shrink-0" />
                                    <span>{student.phoneNumber}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 2: TEACHERS & SUBJECTS */}
              {activeTab === 'teachers' && (
                <motion.div
                  key="tab-teachers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder={isFr ? 'Rechercher par enseignant, matière...' : 'Search by teacher, subject...'}
                        className="h-11 pl-10 pr-4 rounded-2xl bg-white border-slate-200 text-xs font-bold shadow-sm focus-visible:ring-blue-600"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        {isFr ? `${filteredTeachers.length} enseignants affectés` : `${filteredTeachers.length} teachers assigned`}
                      </span>
                    </div>
                  </div>

                  {filteredTeachers.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                        <GraduationCap size={28} />
                      </div>
                      <h4 className="text-base font-black text-slate-700">
                        {isFr ? 'Aucun enseignant assigné' : 'No teachers assigned'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        {isFr
                          ? teacherSearch
                            ? 'Aucun enseignant ne correspond aux critères.'
                            : 'Aucun enseignant n\'a été associé à cette cohorte.'
                          : teacherSearch
                            ? 'No teacher matches your search term.'
                            : 'No teachers have been assigned to this cohort yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTeachers.map((teacher) => {
                        const displayName = teacher.name || teacher.username || 'Enseignant';
                        const initials = displayName
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase() || 'EN';

                        const subjects = teacher.subjects || [];

                        return (
                          <div
                            key={teacher.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-start gap-3.5 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-blue-400 font-black text-sm tracking-wider shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                      {displayName}
                                    </h4>
                                    <Badge className="bg-blue-50 text-blue-700 border-none text-[9px] font-black uppercase px-2 py-0.5">
                                      {isFr ? 'Enseignant' : 'Instructor'}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    {teacher.userId && (
                                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                        #{teacher.userId}
                                      </span>
                                    )}
                                    {teacher.sessionsCount ? (
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={10} className="text-emerald-500" />
                                        {isFr ? `${teacher.sessionsCount} séances/sem` : `${teacher.sessionsCount} sessions/wk`}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              {/* COURSES / SUBJECTS TAUGHT IN THIS CLASS */}
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                  <BookOpen size={12} className="text-blue-600" />
                                  {isFr ? 'Matières & Cours Dispensés :' : 'Teaching Courses in this Class :'}
                                </p>

                                {subjects.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {subjects.map((sub) => (
                                      <span
                                        key={sub.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200/60"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        {sub.name}
                                        {sub.code && <span className="text-[9px] text-blue-500 font-mono">({sub.code})</span>}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 text-xs font-medium italic">
                                    {isFr
                                      ? 'Enseignant titulaire / cours généraux de la cohorte'
                                      : 'Primary cohort teacher / general subject assignment'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Contact Footer */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                              {teacher.email ? (
                                <a
                                  href={`mailto:${teacher.email}`}
                                  className="flex items-center gap-1 hover:text-blue-600 transition-colors truncate max-w-[200px]"
                                >
                                  <Mail size={12} className="text-slate-400" />
                                  <span className="truncate">{teacher.email}</span>
                                </a>
                              ) : <span />}

                              {teacher.phoneNumber && (
                                <a
                                  href={`tel:${teacher.phoneNumber}`}
                                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                >
                                  <Phone size={12} className="text-slate-400" />
                                  <span>{teacher.phoneNumber}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: TIMETABLE */}
              {activeTab === 'timetable' && (
                <motion.div
                  key="tab-timetable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Day of Week Selector Filter */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={selectedDay === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setSelectedDay('ALL')}
                        className={`h-9 px-3 rounded-xl text-xs font-bold ${
                          selectedDay === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white'
                        }`}
                      >
                        {isFr ? 'Tous les jours' : 'All Days'}
                      </Button>
                      {DAY_ORDER.slice(0, 6).map((dayKey) => {
                        const dayLabel = isFr ? DAYS_FR[dayKey] : DAYS_EN[dayKey];
                        const count = data?.timetable?.filter(t => t.dayOfWeek === dayKey).length || 0;
                        return (
                          <Button
                            key={dayKey}
                            size="sm"
                            variant={selectedDay === dayKey ? 'default' : 'outline'}
                            onClick={() => setSelectedDay(dayKey)}
                            className={`h-9 px-3 rounded-xl text-xs font-bold ${
                              selectedDay === dayKey ? 'bg-blue-600 text-white' : 'bg-white'
                            }`}
                          >
                            {dayLabel} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={handlePrintTimetable}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold gap-1.5 shadow-sm ml-auto"
                    >
                      <Printer size={14} className="text-slate-600" />
                      {isFr ? 'Imprimer l\'emploi du temps' : 'Print Timetable'}
                    </Button>
                  </div>

                  {filteredTimetable.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                        <CalendarDays size={28} />
                      </div>
                      <h4 className="text-base font-black text-slate-700">
                        {isFr ? 'Aucun cours programmé' : 'No scheduled sessions'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        {isFr
                          ? selectedDay === 'ALL'
                            ? 'Aucun créneau d\'emploi du temps n\'a encore été enregistré pour cette classe.'
                            : `Aucun cours planifié pour ${DAYS_FR[selectedDay] || selectedDay}.`
                          : selectedDay === 'ALL'
                            ? 'No timetable slots have been scheduled for this class yet.'
                            : `No sessions scheduled on ${DAYS_EN[selectedDay] || selectedDay}.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredTimetable.map((slot) => {
                        const dayLabel = isFr ? DAYS_FR[slot.dayOfWeek] || slot.dayOfWeek : DAYS_EN[slot.dayOfWeek] || slot.dayOfWeek;
                        const subjectName = slot.subject?.name || (isFr ? 'Matière Générale' : 'General Course');
                        const teacherName = slot.teacher?.name || slot.teacher?.username || (isFr ? 'Non spécifié' : 'Unassigned');
                        const roomName = slot.room?.name || slot.roomName || (isFr ? 'Salle standard' : 'Standard Room');

                        return (
                          <div
                            key={slot.id}
                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-3.5">
                              {/* Day badge & Time pill */}
                              <div className="w-28 flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                                  {dayLabel}
                                </span>
                                <div className="flex items-center gap-1 text-slate-900 font-black text-sm">
                                  <Clock size={13} className="text-slate-400 flex-shrink-0" />
                                  <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="hidden sm:block w-px h-10 bg-slate-100" />

                              {/* Subject & Lesson Type */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                    {subjectName}
                                  </h4>
                                  {slot.lessonType && (
                                    <Badge variant="outline" className="text-[9px] font-bold px-2 py-0 border-slate-200 text-slate-500">
                                      {slot.lessonType}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                  <User size={12} className="text-slate-400" />
                                  <span>{isFr ? 'Enseignant :' : 'Teacher :'} <strong className="text-slate-700">{teacherName}</strong></span>
                                </p>
                              </div>
                            </div>

                            {/* Location & Period info */}
                            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
                              {slot.periodName && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                                  {slot.periodName}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/60">
                                <MapPin size={13} className="text-blue-600" />
                                {roomName}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] font-bold text-slate-400">
            {isFr ? 'Complexe Scolaire • Système de Gestion Académique' : 'School Complex • Academic Management System'}
          </p>
          <Button
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider"
          >
            {isFr ? 'Fermer' : 'Close'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
