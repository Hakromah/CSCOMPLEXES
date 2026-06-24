'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, AlertTriangle, Award, Flag } from 'lucide-react';
import api from '@/lib/api';
import type { BehaviorRecord, BehaviorType } from '@/types/school';

const TYPE_CONFIG: Record<BehaviorType, { icon: typeof Award; color: string; bg: string; border: string }> = {
  ACHIEVEMENT: { icon: Award, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  AWARD: { icon: Award, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  RECOGNITION: { icon: Award, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  WARNING: { icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  DISCIPLINE: { icon: Flag, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  INCIDENT: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  OTHER: { icon: Shield, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const isPositive = (type: BehaviorType) => ['ACHIEVEMENT', 'AWARD', 'RECOGNITION'].includes(type);

export default function ChildBehaviorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/parent/children/${id}/behavior`)
      .then(r => setRecords(r.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [id]);

  const achievements = records.filter(r => isPositive(r.type)).length;
  const incidents = records.filter(r => !isPositive(r.type)).length;
  const hasHighSeverity = records.some(r => r.severity === 'HIGH' && !isPositive(r.type));

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
          <span className="text-slate-700">Behavior</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Behavior & Conduct</h1>
      </div>

      {hasHighSeverity && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">Attention Required</p>
            <p className="text-xs text-red-700 mt-0.5">
              Your child has high-severity discipline records. Please contact the school for details.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-green-700">{achievements}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 opacity-70 mt-1">Achievements</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-red-700">{incidents}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 opacity-70 mt-1">Incidents</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-slate-700">{records.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 opacity-70 mt-1">Total Records</p>
        </div>
      </div>

      {/* Timeline */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
          <Shield className="w-12 h-12 opacity-30" />
          <p className="font-semibold">No behavior records</p>
          <p className="text-xs">All conduct is clear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, idx) => {
            const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG.OTHER;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`bg-white rounded-2xl border ${cfg.border} shadow-sm p-5 flex gap-4`}
              >
                <div className={`p-3 rounded-xl ${cfg.bg} shrink-0 h-fit`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-slate-900">{record.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                        {record.type}
                      </span>
                      {record.severity && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          record.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                          record.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {record.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  {record.description && (
                    <p className="text-sm text-slate-600 mt-1">{record.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    {record.recordedBy && (
                      <span>
                        by {record.recordedBy.firstName || record.recordedBy.username}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
