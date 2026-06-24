'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, GraduationCap, Calendar, BarChart2, BookOpen, Shield, ChevronRight, AlertCircle, Bus } from 'lucide-react';
import api from '@/lib/api';
import type { SchoolUser } from '@/types/school';

const navCards = [
  { label: 'Attendance', href: 'attendance', icon: Calendar, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { label: 'Exam Results', href: 'results', icon: BarChart2, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { label: 'Exams', href: 'exams', icon: GraduationCap, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { label: 'Timetable', href: 'timetable', icon: Calendar, color: 'bg-green-50 text-green-600 border-green-100' },
  { label: 'Materials', href: 'materials', icon: BookOpen, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { label: 'Behavior', href: 'behavior', icon: Shield, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { label: 'Transport Details', href: 'transport', icon: Bus, color: 'bg-teal-50 text-teal-600 border-teal-100' },
];

export default function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [student, setStudent] = useState<SchoolUser & { classes?: { id: number; name: string; teachers?: SchoolUser[] }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/parent/children/${id}`);
        setStudent(res.data);
      } catch {
        setError('Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  if (error || !student) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-slate-600 font-medium">{error || 'Student not found'}</p>
      <Link href="/parent/children" className="text-primary font-bold hover:underline text-sm">← Back to Children</Link>
    </div>
  );

  const fullName = student.firstName && student.lastName
    ? `${student.firstName} ${student.lastName}`
    : student.username;
  const initials = (student.firstName?.[0] || student.username[0]).toUpperCase();
  const currentClass = student.classes?.[0];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/parent" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/parent/children" className="hover:text-primary transition-colors">Children</Link>
        <span>/</span>
        <span className="text-slate-700">{fullName}</span>
      </div>

      {/* Student Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="h-24 bg-gradient-to-r from-primary to-blue-500" />
        <div className="px-8 pb-8">
          <div className="flex items-end gap-5 -mt-10 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-primary">
              {initials}
            </div>
            <div className="pb-2">
              <h1 className="text-2xl font-black text-slate-900">{fullName}</h1>
              <p className="text-sm text-slate-500 font-medium">Student ID: {student.userId || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Class', value: currentClass?.name || '—' },
              { label: 'Gender', value: student.gender || '—' },
              { label: 'Date of Birth', value: student.birthDate ? new Date(student.birthDate).toLocaleDateString('en-GB') : '—' },
              { label: 'Enrolled Subjects', value: currentClass?.teachers?.length ? `${currentClass.teachers.length} teachers` : '—' },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Navigation Grid */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Academic Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {navCards.map((card, idx) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <Link href={`/parent/children/${id}/${card.href}`}>
                <div className={`flex items-center gap-4 p-5 bg-white border rounded-2xl hover:border-primary hover:shadow-md transition-all duration-300 group cursor-pointer`}>
                  <div className={`p-3 rounded-xl ${card.color.split(' ').slice(0, 2).join(' ')}`}>
                    <card.icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} />
                  </div>
                  <span className="font-bold text-slate-800 group-hover:text-primary transition-colors">{card.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary ml-auto transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Teachers */}
      {currentClass?.teachers && currentClass.teachers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Class Teachers</h2>
          <div className="flex flex-wrap gap-3">
            {currentClass.teachers.map((t: SchoolUser) => (
              <div key={t.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                  {(t.firstName?.[0] || t.username[0]).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {t.firstName ? `${t.firstName} ${t.lastName || ''}` : t.username}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
