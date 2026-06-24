'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Clock } from 'lucide-react';
import api from '@/lib/api';
import { generateTimetable } from '@/lib/pdf-generator';
import type { TimetableEntry } from '@/types/school';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

export default function ChildTimetablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/parent/children/${id}/timetable`),
      api.get(`/parent/children/${id}`),
    ])
      .then(([ttRes, studentRes]) => {
        setEntries(ttRes.data || []);
        const cls = studentRes.data?.classes?.[0];
        setClassName(cls?.name || '');
      })
      .catch(() => setEntries([]))
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
    const doc = generateTimetable({
      className,
      entries: entries.map(e => ({
        day: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject?.name || '—',
        teacher: e.teacher ? (e.teacher.firstName ? `${e.teacher.firstName} ${e.teacher.lastName || ''}` : e.teacher.username) : undefined,
      })),
    });
    doc.save(`timetable_${className.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <Link href="/parent/children" className="hover:text-primary">Children</Link>
            <span>/</span>
            <Link href={`/parent/children/${id}`} className="hover:text-primary">Profile</Link>
            <span>/</span>
            <span className="text-slate-700">Timetable</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Class Timetable</h1>
          {className && <p className="text-sm text-slate-500 mt-0.5">Class: {className}</p>}
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
          <Clock className="w-12 h-12 opacity-30" />
          <p className="font-semibold">No timetable available</p>
          <p className="text-xs">Contact school to have a timetable assigned</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 w-24">Day</th>
                  {DAYS.map(day => (
                    <th key={day} className="text-center px-4 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 min-w-32">
                      {day.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Determine unique timeslots across all days */}
                {(() => {
                  const allSlots = new Set<string>();
                  entries.forEach(e => allSlots.add(`${e.startTime}|${e.endTime}`));
                  const slots = Array.from(allSlots).sort();
                  return slots.map(slot => {
                    const [start, end] = slot.split('|');
                    return (
                      <tr key={slot} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-xs font-bold text-slate-700">{start}</p>
                          <p className="text-[10px] text-slate-400">–{end}</p>
                        </td>
                        {DAYS.map(day => {
                          const entry = grouped[day].find(e => e.startTime === start && e.endTime === end);
                          if (!entry) return <td key={day} className="px-4 py-3 text-center"><span className="text-slate-200 text-xs">—</span></td>;
                          const subName = entry.subject?.name || 'Unknown';
                          const colorClass = subjectColorMap[subName] || SUBJECT_COLORS[0];
                          return (
                            <td key={day} className="px-2 py-2">
                              <div className={`rounded-xl px-3 py-2 text-xs font-bold border ${colorClass}`}>
                                <p className="truncate">{subName}</p>
                                {entry.teacher && (
                                  <p className="font-normal opacity-70 truncate text-[10px] mt-0.5">
                                    {entry.teacher.firstName || entry.teacher.username}
                                  </p>
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
