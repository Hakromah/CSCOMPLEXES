/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
  Users, School, BookOpen, FileText,
  TrendingUp, ShieldCheck, Briefcase,
  GraduationCap, Download, RefreshCcw,
  PieChart, Activity, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ReportDTO {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  totalExams: number;
  totalSubjects: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports/summary');
      setReport(response.data);
    } catch (error) {
      toast.error('Intelligence sync failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center leading-relaxed">
        Aggregating Institutional <br /> Intelligence...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1.2rem,2vw+1rem,2rem)] lg:p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live Analytics Hub</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter sm:text-[clamp(1.4rem,3.5vw,4rem)] italic uppercase">
            School <span className="text-primary">Report.</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchReport}
            variant="outline"
            className="rounded-[clamp(1.2rem,2vw+1rem,2rem)] h-14 w-14 p-0 border-slate-200 bg-white hover:bg-slate-50 transition-all"
          >
            <RefreshCcw size={20} className="text-slate-600" />
          </Button>
          <Button className="bg-slate-900 hover:bg-blue-600 text-white rounded-[clamp(1.2rem,2vw+1rem,2rem)] h-14 px-8 font-black transition-all shadow-xl shadow-slate-200">
            <Download size={20} className="mr-2" /> EXPORT INTELLIGENCE
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-[clamp(0rem,2vw+1rem,2rem)]">

        {/* Section 1: Human Capital */}
        <div className="space-y-[clamp(0rem,2vw+1rem,2rem)]">
          <div className="flex items-center gap-3 px-2">
            <PieChart className="text-slate-400" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Human Capital Index</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Student Enrollment"
              value={report?.totalStudents}
              icon={GraduationCap}
              color="blue"
              sub="Active learners in registry"
            />
            <StatCard
              label="Faculty Staff"
              value={report?.totalTeachers}
              icon={Briefcase}
              color="amber"
              sub="Certified instructors"
            />
            <StatCard
              label="System Authority"
              value={report?.totalAdmins}
              icon={ShieldCheck}
              color="rose"
              sub="Administrative controllers"
            />
          </div>
        </div>

        {/* Section 2: Structural & Academic Assets */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Activity className="text-slate-400" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Structural Capacity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[clamp(1.2rem,2vw+1rem,2rem)] p-10 text-white shadow-2xl relative overflow-hidden group col-span-1 md:col-span-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <School size={120} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">Functional Units</p>
              <h3 className="text-6xl font-black italic tracking-tighter mb-2">{report?.totalClasses}</h3>
              <p className="text-sm font-bold opacity-60">Total Active Classes</p>
            </div>

            <div className="bg-white rounded-[clamp(1.2rem,2vw+1rem,2rem)] p-10 shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 bg-blue-50 rounded-[clamp(1.2rem,2vw+1rem,2rem)] flex items-center justify-center text-primary mb-6">
                  <BookOpen size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Academic Assessments</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{report?.totalExams}</h3>
              </div>
              <Badge className="w-fit bg-blue-100 text-primary border-none mt-6 font-black text-[9px] tracking-widest">TERM 2026 ACTIVE</Badge>
            </div>

            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                  <FileText size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Curriculum Catalog</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{report?.totalSubjects}</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-6">Defined Academic Subjects</p>
            </div>
          </div>
        </div>

        {/* Intelligence Footer */}
        <div className="bg-blue-600 rounded-[clamp(1.2rem,2vw+1rem,2rem)] p-[clamp(1.2rem,2vw+1rem,2rem)] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-200">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="p-4 bg-white/10 rounded-[clamp(1.2rem,2vw+1rem,2rem)]">
              <Users size={32} />
            </div>
            <div>
              <p className="text-2xl font-black italic tracking-tighter leading-none">System-Wide Roster</p>
              <p className="text-sm font-bold opacity-80 mt-1">Total combined accounts managed by the platform</p>
            </div>
          </div>
          <div className="text-6xl font-black italic tracking-tighter">
            {(report?.totalStudents || 0) + (report?.totalTeachers || 0) + (report?.totalAdmins || 0)}
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component for individual statistics
function StatCard({ label, value, icon: Icon, color, sub }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-primary",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors"
    >
      <div className={`h-14 w-14 ${colorMap[color]} rounded-2xl flex items-center justify-center mb-6`}>
        <Icon size={28} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
        <TrendingUp size={20} className="text-emerald-500 mb-1" />
      </div>
      <p className="text-xs font-bold text-slate-400">{sub}</p>
    </motion.div>
  );
}
