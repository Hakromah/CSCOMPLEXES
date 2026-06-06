'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  FileText,
  TrendingUp,
  Clock,
  Award,
  Calendar as CalendarIcon,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer
} from 'recharts';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock data for the chart if backend doesn't provide weekly progress yet
const attendanceData = [
  { day: 'Mon', value: 100 },
  { day: 'Tue', value: 80 },
  { day: 'Wed', value: 95 },
  { day: 'Thu', value: 90 },
  { day: 'Fri', value: 100 },
];

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    courseCount: 0,
    attendance: 0,
    materials: 0,
    averageGrade: 'N/A',
    upcomingExam: null as any,
    recentActivity: [] as any[],
  });
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          api.get('/student/dashboard-stats'),
          api.get('/auth/me') // Assuming you have an endpoint for user profile
        ]);
        setStats(statsRes.data);
        setStudentName(userRes.data.name);
      } catch (error) {
        console.error("Dashboard sync error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-5 md:p-[clamp(1rem,2.5vw+1rem,2rem)] lg:p-10 space-y-[clamp(1rem,1.5vw+1rem,2rem)]">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter">
            Bon retour,<span className="text-primary">{(studentName || 'Student').split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">
            Statut du système: <span className="text-emerald-500">Actif</span> • Semestre 2 Année 2026
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-white border border-primary/0 md:hover:border-primary duration-500 hover:bg-slate-50 text-slate-900 rounded-2xl px-6 h-12 font-bold shadow-sm">
            <CalendarIcon size={18} className="mr-1 text-primary" />
            Emploi du temps
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Cours Actifs', value: stats.courseCount, icon: BookOpen, color: 'text-primary', bg: 'bg-blue-50' },
          { label: 'Présence', value: `${stats.attendance}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ressources', value: stats.materials, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Moy. Générale', value: stats.averageGrade, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="transition-all duration-500 border border-transparent md:hover:border-primary rounded-2xl">
              <CardContent className="px-4 shadow-sm rounded-2xl bg-white md:group-hover/card:shadow-md overflow-hidden md:px-[clamp(1rem,2.5vw+1rem,2rem)] py-4 md:py-[clamp(1rem,2.5vw+1rem,1.5rem)] border-primary/0 duration-500">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-slate-100 uppercase font-black text-slate-400">Live</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{item.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Section */}
        <Card className="lg:col-span-2 shadow-sm rounded-4 md:rounded-3xl border border-primary/0 md:hover:border-primary duration-500 bg-white p-4 md:p-[clamp(1rem,2.5vw+1rem,2rem)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900  uppercase tracking-tight">Pouls de présence</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Suivi de la cohérence hebdomadaire</p>
            </div>
            <TrendingUp className="text-emerald-500" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                />
                <YAxis hide domain={[0, 100]} />
                <ReTooltip
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border border-slate-800 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-4 md:rounded-3xl bg-slate-900 text-white p-4 md:p-[clamp(1rem,2.5vw+1rem,2rem)] overflow-hidden relative group">
            <div className="relative z-10">
              <h2 className="text-lg font-black uppercase tracking-widest mb-4">Rappel d'examen</h2>

              {stats.upcomingExam ? (
                <div className="group/calendar flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 md:hover:border-white duration-500">
                  <div className="bg-primary p-3 rounded-2xl md:group-hover/calendar:bg-white md:group-hover/calendar:text-primary duration-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">{stats.upcomingExam.name}</p>
                    <p className="text-sm font-medium">{new Date(stats.upcomingExam.date).toLocaleDateString()} • {stats.upcomingExam.time?.slice(0, 5) || '12:00'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                  <div className="bg-slate-800 p-3 rounded-2xl">
                    <CheckCircle size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun examen à venir</p>
                    <p className="text-sm font-medium text-slate-500">Vous êtes à jour !</p>
                  </div>
                </div>
              )}

              <Button className="w-full mt-6 bg-white text-slate-900 md:hover:bg-primary md:hover:text-white rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest transition-all duration-500">
                Guide d'étude
              </Button>
            </div>
            <BookOpen className="absolute -right-8 -bottom-8 text-white/5" size={180} />
          </Card>

          <Card className="group/card border border-primary/0 md:hover:border-primary duration-500 shadow-sm rounded-4 md:rounded-3xl bg-white p-4 md:p-[clamp(1rem,2.5vw+1rem,2rem)]">
            <h2 className="text-xs font-black uppercase text-slate-400 group-hover/card:text-primary duration-500 tracking-widest mb-6">Activités récentes</h2>
            <div className="space-y-6">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-blue-50" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 tracking-tight">{activity.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-sm font-medium">Aucune activité récente</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
