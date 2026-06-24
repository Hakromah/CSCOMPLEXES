'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GraduationCap, Clock, Calendar } from 'lucide-react';
import api from '@/lib/api';
import type { SchoolExam } from '@/types/school';

export default function ChildExamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [exams, setExams] = useState<SchoolExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    api.get(`/parent/children/${id}/exams`)
      .then(r => setExams(r.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [id]);

  const now = new Date();
  const upcoming = exams.filter(e => new Date(e.date) >= now && !e.closed);
  const past = exams.filter(e => new Date(e.date) < now || e.closed);

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
          <Link href="/parent/children" className="hover:text-primary">Children</Link>
          <span>/</span>
          <Link href={`/parent/children/${id}`} className="hover:text-primary">Profile</Link>
          <span>/</span>
          <span className="text-slate-700">Exams</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Exam Schedule</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {(['upcoming', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Past'} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400 gap-2">
              <GraduationCap className="w-10 h-10 opacity-30" />
              <p className="font-medium">No upcoming exams</p>
            </div>
          ) : (
            upcoming.map((exam, idx) => {
              const days = daysUntil(exam.date);
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-5"
                >
                  <div className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${days <= 3 ? 'bg-red-50 text-red-600' : days <= 7 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    <p className="text-2xl font-black leading-none">{days}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider">{days === 1 ? 'day' : 'days'}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900">{exam.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{exam.subject?.name || '—'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.startTime} – {exam.endTime}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase ${days <= 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {days <= 3 ? 'Soon!' : exam.semester}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Past */}
      {tab === 'past' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {past.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
              <GraduationCap className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">No past exams</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    {['Exam', 'Subject', 'Date', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {past.map(exam => (
                    <tr key={exam.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{exam.name}</td>
                      <td className="px-5 py-3 text-slate-500">{exam.subject?.name || '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{new Date(exam.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${exam.closed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {exam.closed ? 'Closed' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
