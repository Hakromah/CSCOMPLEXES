'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import type { ExamResult } from '@/types/school';

const gradeColor = (marks: number) => {
  if (marks >= 90) return 'text-green-700 bg-green-100';
  if (marks >= 70) return 'text-blue-700 bg-blue-100';
  if (marks >= 50) return 'text-amber-700 bg-amber-100';
  return 'text-red-700 bg-red-100';
};

export default function ChildResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/parent/children/${id}/results`)
      .then(r => setResults(r.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [id]);

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.marks, 0) / results.length)
    : 0;

  const chartData = results.map(r => ({
    exam: r.exam?.name?.substring(0, 12) || 'Exam',
    marks: r.marks,
  }));

  const subjectMap: Record<string, number[]> = {};
  results.forEach(r => {
    const sub = r.exam?.subject?.name || 'Other';
    if (!subjectMap[sub]) subjectMap[sub] = [];
    subjectMap[sub].push(r.marks);
  });
  const subjectData = Object.entries(subjectMap).map(([subject, marks]) => ({
    subject: subject.substring(0, 10),
    avg: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
          <Link href="/parent/children" className="hover:text-primary">Children</Link>
          <span>/</span>
          <Link href={`/parent/children/${id}`} className="hover:text-primary">Profile</Link>
          <span>/</span>
          <span className="text-slate-700">Results</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Exam Results</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Exams', value: results.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Average Score', value: `${avgScore}%`, color: avgScore >= 70 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600' },
          { label: 'Best Score', value: results.length ? `${Math.max(...results.map(r => r.marks))}%` : '—', color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5 text-center`}>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Score Trend</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="exam" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="marks" stroke="#2563eb" fill="url(#scoreGrad)" strokeWidth={2} name="Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Subject Averages</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="subject" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avg" fill="#2563eb" radius={[6, 6, 0, 0]} name="Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">All Results</h2>
        </div>
        {results.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
            <GraduationCap className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">No results available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Exam', 'Subject', 'Date', 'Score', 'Grade', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map(r => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800">{r.exam?.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{r.exam?.subject?.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {r.exam?.date ? new Date(r.exam.date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${gradeColor(r.marks)}`}>
                        {r.marks}%
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-700">{r.letterGrade || r.grade || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
