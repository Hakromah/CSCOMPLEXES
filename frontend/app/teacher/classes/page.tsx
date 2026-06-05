'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { School, Users, Calendar, ArrowRight, BookOpen, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Class {
  id: number;
  name: string;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const response = await api.get('/teacher/classes');
        if (isMounted) setClasses(response.data);
      } catch (error) {
        toast.error('Failed to load class registry');
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-6 lg:p-10 md:min-h-screen bg-[#f8fafc]">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-[clamp(1rem,2vw+1rem,2rem)] max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <School className="text-primary w-5 h-5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Assignment Ledger</h2>
          </div>
          <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter italic">
            My <span className="text-primary">Classrooms.</span>
          </h1>
          <p className="mt-4 text-slate-500 font-medium max-w-2xl text-base bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 inline-block">
            Manage your assigned cohorts, access quick actions, and jump directly into grading protocols.
          </p>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">Synchronizing Grid...</p>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <div className="max-w-7xl mx-auto bg-white rounded-[3rem] p-24 text-center border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm flex flex-col items-center">
          <div className="bg-slate-50 p-8 rounded-full mb-8">
            <School size={64} className="text-slate-200" />
          </div>
          <h3 className="text-[clamp(1.2rem,2.5vw+1rem,2rem)] font-black text-slate-700 tracking-tight mb-3">No Classes Assigned</h3>
          <p className="text-slate-400 font-medium text-lg max-w-md">You currently have no active cohorts assigned to you in the global registry.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {classes.map((cls, idx) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border border-slate-100 md:hover:border-primary transition-colors duration-500 shadow-sm hover:shadow-2xl rounded-[2.5rem] bg-white group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-slate-50 p-4 rounded-3xl group-hover:bg-blue-50 group-hover:text-primary transition-colors">
                      <Users size={28} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-[clamp(1rem,2vw+1rem,2rem)]">
                      COHORT #{cls.id}
                    </span>
                  </div>

                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-2 group-hover:text-primary transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-2">
                    <Activity size={12} className="text-emerald-500" /> Active Semester Status
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <a href="/teacher/attendance" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors font-black text-[9px] uppercase tracking-widest">
                      <Calendar size={20} className="mb-1" />
                      Attendance
                    </a>
                    <a href="/teacher/results" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 transition-colors font-black text-[9px] uppercase tracking-widest">
                      <BookOpen size={20} className="mb-1" />
                      Grading
                    </a>
                  </div>

                  <Button className="w-full h-14 rounded-3xl bg-slate-900 md:hover:bg-blue-600 duration-500 text-white font-black uppercase text-[10px] tracking-[0.15em] transition-all group-hover:shadow-xl group-hover:shadow-blue-200" asChild>
                    <a href={`/teacher/timetables`}>
                      View Schedule <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
