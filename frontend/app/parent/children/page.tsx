'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, ChevronRight, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import type { SchoolUser } from '@/types/school';

export default function MyChildrenPage() {
  const [children, setChildren] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/parent/children');
        setChildren(res.data || []);
      } catch {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Parent Portal</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">My Children</h1>
        <p className="text-sm text-slate-500 mt-1">{children.length} child{children.length !== 1 ? 'ren' : ''} linked to your account</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        {children.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Users className="w-12 h-12 opacity-30" />
            <p className="font-semibold">No children linked to your account</p>
            <p className="text-xs text-center">Contact the school administrator to link your children to your account.</p>
          </div>
        ) : (
          children.map((child, idx) => {
            const fullName = child.firstName && child.lastName
              ? `${child.firstName} ${child.lastName}`
              : child.username;
            const initials = (child.firstName?.[0] || child.username[0]).toUpperCase();

            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-primary hover:shadow-md transition-all duration-300"
              >
                <div className="h-3 bg-gradient-to-r from-primary to-blue-500" />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary">
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">{fullName}</h2>
                      <p className="text-xs text-slate-400 font-medium">ID: {child.userId || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Role</p>
                      <p className="text-slate-700 font-bold mt-0.5">{child.schoolRole}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Gender</p>
                      <p className="text-slate-700 font-bold mt-0.5">{child.gender || '—'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/parent/children/${child.id}`} className="flex-1">
                      <button className="w-full bg-primary text-white rounded-xl py-2.5 text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <Users className="w-3.5 h-3.5" /> View Profile
                      </button>
                    </Link>
                    <Link href={`/parent/children/${child.id}/attendance`}>
                      <button className="bg-slate-100 text-slate-700 rounded-xl px-3 py-2.5 hover:bg-slate-200 transition-colors">
                        <GraduationCap className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href={`/parent/children/${child.id}/results`}>
                      <button className="bg-slate-100 text-slate-700 rounded-xl px-3 py-2.5 hover:bg-slate-200 transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
