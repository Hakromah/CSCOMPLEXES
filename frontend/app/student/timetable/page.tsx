'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  BookOpen,
  MapPin,
  Calendar,
  Info,
  Loader2,
  ArrowRight,
  GraduationCap,
  Download,
  User,
  Sparkles,
  Zap,
  Grid,
  ListFilter
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateTimetable } from '@/lib/pdf-generator';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
};

const LESSON_TYPES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REGULAR: { label: 'Cours Magistral', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  PRACTICAL: { label: 'Travaux Pratiques (TP)', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  LAB: { label: 'Laboratoire', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  TUTORIAL: { label: 'Travaux Dirigés (TD)', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  BREAK: { label: 'Pause / Récréation', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  LUNCH: { label: 'Pause Déjeuner', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  ASSEMBLY: { label: 'Rassemblement', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  EXAM: { label: 'Évaluation / Examen', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  STUDY: { label: 'Étude Surveillée', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  SPORTS: { label: 'Éducation Physique / Sport', color: 'text-lime-700', bg: 'bg-lime-50', border: 'border-lime-200' },
  OTHER: { label: 'Autre Activité', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

function timeToMin(t?: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

export default function StudentTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    return DAYS.includes(today) ? today : 'MONDAY';
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keep clock updated for live class indicators
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ttRes, userRes] = await Promise.all([
          api.get('/student/timetables'),
          api.get('/auth/me').catch(() => ({ data: null }))
        ]);
        setTimetable(Array.isArray(ttRes.data) ? ttRes.data : []);
        setStudentInfo(userRes.data);
      } catch (error) {
        console.error('Student schedule error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter and Sort: Current Day Schedule
  const dailySchedule = useMemo(() => {
    return timetable
      .filter(item => item.dayOfWeek === activeDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, activeDay]);

  // Determine current active class (NOW) and upcoming class (NEXT)
  const { currentClass, nextClass } = useMemo(() => {
    const todayStr = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const todayClasses = timetable
      .filter(item => item.dayOfWeek === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    let active: any = null;
    let upcoming: any = null;

    for (const c of todayClasses) {
      const startMin = timeToMin(c.startTime);
      const endMin = timeToMin(c.endTime);

      if (nowMinutes >= startMin && nowMinutes < endMin) {
        active = { ...c, remainingMinutes: endMin - nowMinutes };
        break;
      } else if (nowMinutes < startMin && !upcoming) {
        upcoming = { ...c, minutesUntil: startMin - nowMinutes };
      }
    }

    return { currentClass: active, nextClass: upcoming };
  }, [timetable, currentTime]);

  const handleExportPDF = () => {
    if (timetable.length === 0) {
      toast.error("Aucune donnée d'emploi du temps à exporter");
      return;
    }
    const studentClassName = timetable[0]?.classe?.name || 'Emploi du Temps Élève';
    try {
      const pdfData = {
        className: studentClassName,
        entries: timetable.map(item => ({
          day: item.dayOfWeek,
          startTime: item.startTime?.substring(0, 5) || '',
          endTime: item.endTime?.substring(0, 5) || '',
          subject: item.subject?.name || '—',
          teacher: item.teacher?.name || item.teacher?.username || '—',
          room: item.room?.name || item.roomName || '—',
          lessonType: LESSON_TYPES[item.lessonType]?.label || item.lessonType,
        }))
      };
      const doc = generateTimetable(pdfData);
      doc.save('emploi-du-temps-' + studentClassName.toLowerCase().replace(/\s+/g, '-') + '.pdf');
      toast.success('Emploi du temps téléchargé avec succès');
    } catch (err) {
      toast.error('Échec de génération du PDF');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50/50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Synchronisation de votre planning...
        </p>
      </div>
    );
  }

  const enrolledClassName = timetable[0]?.classe?.name || studentInfo?.enrolledClasses?.[0]?.name || '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-8">
      {/* ─── HEADER SECTION ──────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600/10 text-blue-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Portail Élève • {enrolledClassName ? ('Classe : ' + enrolledClassName) : 'Inscrit'}
            </Badge>
          </div>
          <h1 className="text-[clamp(1.5rem,2.5vw+1rem,2.8rem)] font-black text-slate-950 tracking-tighter">
            Mon Emploi <span className="text-blue-600 italic">du Temps</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
            <button
              onClick={() => setViewMode('day')}
              className={'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ' + (
                viewMode === 'day' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Vue Quotidienne
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ' + (
                viewMode === 'week' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Semaine Complète
            </button>
          </div>

          <Button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-5 font-black text-xs shadow-md"
          >
            <Download size={15} className="mr-2" /> PDF
          </Button>
        </div>
      </header>

      {/* ─── LIVE NOW / UP NEXT HERO CARD ────────────────────────────── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CURRENT CLASS (NOW) */}
        <div className={'p-6 rounded-3xl border transition-all shadow-sm relative overflow-hidden ' + (
          currentClass
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent'
            : 'bg-white text-slate-800 border-slate-100'
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={'w-2.5 h-2.5 rounded-full ' + (currentClass ? 'bg-emerald-400 animate-ping' : 'bg-slate-300')} />
              <span className={'text-[10px] font-black uppercase tracking-widest ' + (currentClass ? 'text-blue-100' : 'text-slate-400')}>
                En cours maintenant
              </span>
            </div>
            {currentClass && (
              <Badge className="bg-white/20 text-white border-none font-bold text-[10px]">
                {currentClass.remainingMinutes} min restantes
              </Badge>
            )}
          </div>

          {currentClass ? (
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">
                {currentClass.subject?.name || 'Matière'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-blue-100 pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {currentClass.startTime?.substring(0,5)} - {currentClass.endTime?.substring(0,5)}
                </span>
                {(currentClass.room?.name || currentClass.roomName) && (
                  <span className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-xl">
                    <MapPin size={13} /> {currentClass.room?.name || currentClass.roomName}
                  </span>
                )}
                {currentClass.teacher && (
                  <span className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-xl">
                    <User size={13} /> {currentClass.teacher.name || currentClass.teacher.username}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2">
              <h3 className="text-base font-black text-slate-700">
                Aucun cours en ce moment
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Profitez de votre pause ou consultez votre prochain cours.
              </p>
            </div>
          )}
        </div>

        {/* UP NEXT CLASS */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Prochain cours aujourd'hui
              </span>
              {nextClass && (
                <Badge className="bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                  Dans {nextClass.minutesUntil} min
                </Badge>
              )}
            </div>

            {nextClass ? (
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                  {nextClass.subject?.name || 'Matière'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-2">
                  <span className="flex items-center gap-1 text-slate-800">
                    <Clock size={14} className="text-blue-600" />
                    {nextClass.startTime?.substring(0,5)} à {nextClass.endTime?.substring(0,5)}
                  </span>
                  {(nextClass.room?.name || nextClass.roomName) && (
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border">
                      <MapPin size={12} className="text-emerald-600" />
                      {nextClass.room?.name || nextClass.roomName}
                    </span>
                  )}
                  {nextClass.teacher && (
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border">
                      <User size={12} className="text-purple-600" />
                      {nextClass.teacher.name || nextClass.teacher.username}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2">
                <h3 className="text-base font-black text-slate-600">
                  Fin des cours pour aujourd'hui
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  Tous les cours de la journée sont terminés.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN TIMETABLE CONTENT ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Day Navigator (for Daily View) */}
        {viewMode === 'day' && (
          <nav>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {DAYS.map((day) => (
                <Button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={'px-6 py-3.5 rounded-2xl font-black text-xs tracking-wider transition-all cursor-pointer ' + (
                    activeDay === day
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-800'
                  )}
                >
                  {DAY_LABELS[day]}
                </Button>
              ))}
            </div>
          </nav>
        )}

        {/* View Mode 1: Daily Timeline */}
        {viewMode === 'day' ? (
          <div className="space-y-4">
            {dailySchedule.map((entry, idx) => {
              const lt = LESSON_TYPES[entry.lessonType] || LESSON_TYPES.REGULAR;
              return (
                <Card
                  key={entry.id}
                  className="border border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden transition-all hover:shadow-md"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                      {/* Time Sidebar */}
                      <div className="bg-slate-950 text-white p-5 md:w-52 flex flex-col justify-center items-center border-r border-slate-100">
                        <Clock className="text-blue-400 mb-1" size={18} />
                        <span className="font-black text-white text-base tracking-tight">
                          {entry.startTime?.substring(0, 5)} - {entry.endTime?.substring(0, 5)}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          {entry.periodName || (('Période ') + (idx + 1))}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={'text-[9px] font-black uppercase tracking-wider border ' + lt.color + ' ' + lt.bg}>
                            {lt.label}
                          </Badge>
                          {(entry.room?.name || entry.roomName) && (
                            <span className="text-xs font-black text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                              <MapPin size={13} /> {entry.room?.name || entry.roomName}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">
                          {entry.subject?.name || 'Matière'}
                        </h3>

                        {entry.teacher && (
                          <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1.5">
                            <User size={13} className="text-purple-600" />
                            Professeur : {entry.teacher.name || entry.teacher.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {dailySchedule.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 bg-white">
                <Calendar size={44} className="mb-3 opacity-20" />
                <p className="font-black uppercase text-xs tracking-widest text-slate-400">
                  Aucun cours programmé le {DAY_LABELS[activeDay]}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Full Weekly Matrix */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {DAYS.map((day) => {
              const dayCourses = timetable
                .filter((e) => e.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div key={day} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="font-black text-slate-900 text-xs tracking-wider uppercase">
                      {DAY_LABELS[day]}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">
                      {dayCourses.length} cours
                    </Badge>
                  </div>

                  <div className="space-y-3 flex-1 min-h-[350px]">
                    {dayCourses.map((c) => {
                      const lt = LESSON_TYPES[c.lessonType] || LESSON_TYPES.REGULAR;
                      return (
                        <div
                          key={c.id}
                          className={'p-3.5 rounded-2xl border transition-all ' + lt.border + ' ' + lt.bg}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>{c.startTime?.substring(0, 5)} - {c.endTime?.substring(0, 5)}</span>
                          </div>
                          <p className="font-black text-slate-900 text-xs uppercase tracking-tight line-clamp-1">
                            {c.subject?.name || 'Matière'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mt-2">
                            {(c.room?.name || c.roomName) && (
                              <span className="text-emerald-700 flex items-center gap-0.5">
                                <MapPin size={10} /> {c.room?.name || c.roomName}
                              </span>
                            )}
                          </div>
                          {c.teacher && (
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-1">
                              👨‍🏫 {c.teacher.name || c.teacher.username}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {dayCourses.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center py-12">
                        <Calendar size={28} className="opacity-30 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Aucun cours
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
