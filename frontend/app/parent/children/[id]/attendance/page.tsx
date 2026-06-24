'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { generateAttendanceReport } from '@/lib/pdf-generator';
import type { AttendanceRecord, AttendanceSummary } from '@/types/school';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PRESENT: { color: 'text-green-700', bg: 'bg-green-100', label: 'Present' },
  ABSENT: { color: 'text-red-700', bg: 'bg-red-100', label: 'Absent' },
  LATE: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Late' },
  EXCUSED: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Excused' },
  SICK: { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Sick' },
};

const DAY_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-400',
  ABSENT: 'bg-red-400',
  LATE: 'bg-amber-400',
  EXCUSED: 'bg-blue-400',
  SICK: 'bg-purple-400',
};

export default function ChildAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [records, setRecords] = useState<(AttendanceRecord & { session?: { date: string; subject?: { name: string }; sessionTime?: string } })[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [studentName, setStudentName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attendRes, studentRes] = await Promise.all([
        api.get(`/parent/children/${id}/attendance?month=${month}&year=${year}`),
        api.get(`/parent/children/${id}`),
      ]);
      setRecords(attendRes.data?.records || []);
      setSummary(attendRes.data?.summary || null);
      const s = studentRes.data;
      setStudentName(s?.firstName ? `${s.firstName} ${s.lastName || ''}` : s?.username || '');
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [id, month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownload = () => {
    if (!summary) return;
    const doc = generateAttendanceReport({
      studentName,
      period: `${new Date(year, month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}`,
      records: records.map(r => ({
        date: r.session?.date || '',
        subject: r.session?.subject?.name,
        status: r.status,
        sessionTime: r.session?.sessionTime,
      })),
      summary,
    });
    doc.save(`attendance_${studentName.replace(/\s+/g, '_')}_${month}_${year}.pdf`);
  };

  // Build calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const recordsByDate: Record<string, string> = {};
  records.forEach(r => {
    if (r.session?.date) {
      const d = new Date(r.session.date).getDate();
      recordsByDate[d] = r.status;
    }
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('en-GB', { month: 'long' }),
  }));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <Link href="/parent/children" className="hover:text-primary">Children</Link>
            <span>/</span>
            <Link href={`/parent/children/${id}`} className="hover:text-primary">{studentName}</Link>
            <span>/</span>
            <span className="text-slate-700">Attendance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Record</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Alert if poor attendance */}
      {summary && summary.presentPercent < 75 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Low Attendance Alert</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Attendance rate is {summary.presentPercent}%. Minimum required is 75%. Please contact the school.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Present', value: summary.present, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Absent', value: summary.absent, icon: XCircle, color: 'text-red-600 bg-red-50' },
            { label: 'Late', value: summary.late, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Excused', value: summary.excused, icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
            { label: 'Rate', value: `${summary.presentPercent}%`, icon: CheckCircle, color: summary.presentPercent >= 75 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
          ].map(item => (
            <div key={item.label} className={`${item.color} rounded-2xl p-4 flex flex-col items-center gap-1`}>
              <item.icon className={`w-5 h-5`} />
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-4">Monthly Calendar</h2>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <p key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const status = recordsByDate[day];
            return (
              <div
                key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold
                  ${status ? `${DAY_COLORS[status]} text-white` : 'bg-slate-100 text-slate-400'}`}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${DAY_COLORS[key]}`} />
              <span className="text-xs text-slate-500 font-medium">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Session Records</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
            <CheckCircle className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">No records for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Subject</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Time</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map(record => {
                  const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.PRESENT;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-700">
                        {record.session?.date ? new Date(record.session.date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-500">{record.session?.subject?.name || '—'}</td>
                      <td className="px-6 py-3 text-slate-500">{record.session?.sessionTime || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
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
    </div>
  );
}
