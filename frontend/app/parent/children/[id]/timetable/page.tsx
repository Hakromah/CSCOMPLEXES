'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Clock,
  MapPin,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import api from '@/lib/api';
import { generateTimetable } from '@/lib/pdf-generator';
import type { TimetableEntry } from '@/types/school';
import { toast } from 'sonner';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
};

const LESSON_TYPES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REGULAR: { label: 'Cours', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  PRACTICAL: { label: 'TP', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  LAB: { label: 'Labo', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  TUTORIAL: { label: 'TD', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  BREAK: { label: 'Pause', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  LUNCH: { label: 'Déjeuner', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  ASSEMBLY: { label: 'Rassemblement', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  EXAM: { label: 'Examen', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  STUDY: { label: 'Étude', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  SPORTS: { label: 'Sport', color: 'text-lime-700', bg: 'bg-lime-50', border: 'border-lime-200' },
};

const SUBJECT_COLORS = [
  'bg-blue-50 text-blue-800 border-blue-200',
  'bg-purple-50 text-purple-800 border-purple-200',
  'bg-emerald-50 text-emerald-800 border-emerald-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-rose-50 text-rose-800 border-rose-200',
  'bg-indigo-50 text-indigo-800 border-indigo-200',
  'bg-teal-50 text-teal-800 border-teal-200',
  'bg-cyan-50 text-cyan-800 border-cyan-200',
];

export default function ChildTimetablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [className, setClassName] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'daily'>('matrix');
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');

  useEffect(() => {
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayNames[new Date().getDay()];
    if (DAYS.includes(currentDay as any)) {
      setSelectedDay(currentDay);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/parent/children/${id}/timetable`),
      api.get(`/parent/children/${id}`),
    ])
      .then(([ttRes, studentRes]) => {
        const raw = ttRes.data;
        const list = Array.isArray(raw) ? raw : (raw?.entries || []);
        const filtered = list.filter((e: any) => !e.status || e.status === 'PUBLISHED');
        setEntries(filtered);
        
        const st = studentRes.data;
        setStudent(st);
        const cls = st?.enrolledClasses?.[0] || st?.classes?.[0];
        setClassName(cls?.name || '');
      })
      .catch((err) => {
        console.error('Failed to load child timetable', err);
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const subjectColorMap: Record<string, string> = {};
  let colorIdx = 0;

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    acc[day].forEach(e => {
      const subName = e.subject?.name || 'Unknown';
      if (!subjectColorMap[subName]) {
        subjectColorMap[subName] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
        colorIdx++;
      }
    });
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  const handleDownload = () => {
    try {
      const doc = generateTimetable({
        className: className || (student?.username ? `${student.username}` : 'Emploi du Temps'),
        academicYear: entries[0]?.academicYear?.name || undefined,
        semester: entries[0]?.semester?.name || undefined,
        entries: entries.map(e => ({
          day: e.dayOfWeek,
          startTime: e.startTime,
          endTime: e.endTime,
          subject: e.subject?.name || '—',
          subjectCode: e.subject?.code,
          room: (e as any).room?.name || (e as any).roomName,
          lessonType: (e as any).lessonType,
          teacher: e.teacher ? (e.teacher.firstName ? `${e.teacher.firstName} ${e.teacher.lastName || ''}` : e.teacher.username) : undefined,
        })),
      });
      doc.save(`timetable_${(className || 'student').replace(/\s+/g, '_')}.pdf`);
      toast.success('Emploi du temps PDF généré avec succès');
    } catch (e: any) {
      toast.error('Échec de la génération du PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Chargement de l\'emploi du temps...</p>
      </div>
    </div>
  );

  const childName = student ? (student.firstName ? `${student.firstName} ${student.lastName || ''}` : student.username) : '';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <Link href="/parent/children" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Enfants
            </Link>
            <span>/</span>
            <Link href={`/parent/children/${id}`} className="hover:text-blue-600 transition-colors">
              {childName || 'Profil'}
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Emploi du Temps</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Emploi du Temps
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {childName ? `${childName} • ` : ''}{className ? `${'Classe'}: ${className}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Grille Hebdo
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Vue Journalière
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={entries.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" /> Télécharger PDF
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 text-lg">Aucun emploi du temps publié</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            L\'emploi du temps de cet élève n\'a pas encore été configuré ou publié par l\'administration.
          </p>
        </div>
      ) : activeTab === 'daily' ? (
        <div className="space-y-4">
          {/* Day selection pill tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DAYS.map(day => {
              const count = (grouped[day] || []).length;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  <span>{DAY_LABELS[day]}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule List */}
          <div className="space-y-3">
            {(grouped[selectedDay] || []).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 font-medium text-xs">
                Aucun cours prévu pour {DAY_LABELS[selectedDay]}.
              </div>
            ) : (
              (grouped[selectedDay] || []).map((entry, idx) => {
                const subName = entry.subject?.name || '—';
                const lType = (entry as any).lessonType || 'REGULAR';
                const typeCfg = LESSON_TYPES[lType] || LESSON_TYPES.REGULAR;
                const roomName = (entry as any).room?.name || (entry as any).roomName;

                return (
                  <div
                    key={entry.id || idx}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white font-mono font-black text-xs tracking-tight text-center min-w-[100px]">
                        <div>{entry.startTime}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-medium">{entry.endTime}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-900 text-sm">{subName}</h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                            {typeCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                          {entry.teacher && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Prof:</span>
                              {entry.teacher.firstName ? `${entry.teacher.firstName} ${entry.teacher.lastName || ''}` : entry.teacher.username}
                            </span>
                          )}
                          {roomName && (
                            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] font-bold">
                              <MapPin className="w-3 h-3" /> {roomName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Weekly Matrix View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 w-28">
                    Horaire
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 min-w-36 text-center">
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const allSlots = new Set<string>();
                  entries.forEach(e => allSlots.add(`${e.startTime}|${e.endTime}`));
                  const slots = Array.from(allSlots).sort();
                  
                  if (slots.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                          Aucun créneau programmé
                        </td>
                      </tr>
                    );
                  }

                  return slots.map(slot => {
                    const [start, end] = slot.split('|');
                    return (
                      <tr key={slot} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 align-top bg-slate-50/30">
                          <p className="text-xs font-black text-slate-800 font-mono">{start}</p>
                          <p className="text-[10px] text-slate-400 font-mono">– {end}</p>
                        </td>
                        {DAYS.map(day => {
                          const entry = grouped[day]?.find(e => e.startTime === start && e.endTime === end);
                          if (!entry) {
                            return (
                              <td key={day} className="px-3 py-3 text-center align-middle">
                                <span className="text-slate-200 text-xs font-bold">—</span>
                              </td>
                            );
                          }
                          const subName = entry.subject?.name || '—';
                          const colorClass = subjectColorMap[subName] || SUBJECT_COLORS[0];
                          const roomName = (entry as any).room?.name || (entry as any).roomName;
                          const lType = (entry as any).lessonType;
                          const typeCfg = lType ? LESSON_TYPES[lType] : null;

                          return (
                            <td key={day} className="px-2 py-2 align-top">
                              <div className={`rounded-2xl p-2.5 text-xs border shadow-sm flex flex-col gap-1 ${colorClass}`}>
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-black text-slate-900 truncate">{subName}</p>
                                  {typeCfg && (
                                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-white/70 text-slate-700">
                                      {typeCfg.label}
                                    </span>
                                  )}
                                </div>
                                {entry.teacher && (
                                  <p className="text-[10px] font-medium text-slate-600 truncate">
                                    {entry.teacher.firstName ? `${entry.teacher.firstName} ${entry.teacher.lastName || ''}` : entry.teacher.username}
                                  </p>
                                )}
                                {roomName && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="truncate">{roomName}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
