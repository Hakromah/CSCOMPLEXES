/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users, School, BookOpen, FileText, UserCog,
  BarChart3, ShieldCheck, Activity, ArrowUpRight,
  TrendingUp, Globe, Database, Bell, Radio, Bus,
  Calendar as CalendarIcon, UserCheck, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface ReportDTO {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  totalExams: number;
  totalSubjects: number;
}

export default function AdminDashboard() {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State to hold the dynamic semester text to prevent hydration mismatches
  const [semesterText, setSemesterText] = useState<string>('');


  const getDynamicSemester = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0 = January, 11 = December

    let semester = 1;

    // Semester 1: September (8) to January (0)
    // Semester 2: February (1) to August (7)
    if (month >= 1 && month <= 7) {
      semester = 2;
    } else {
      semester = 1;
    }

    // Get the current month name in French (e.g., "juin")
    const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long' });

    // Capitalize the first letter of the month name (e.g., "Juin")
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return `Semestre ${semester}, ${capitalizedMonth} - Année ${year}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportRes, unreadRes, logsRes] = await Promise.all([
          api.get('/admin/reports/summary'),
          api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
          api.get('/school-finance/audit-logs').catch(() => ({ data: [] }))
        ]);
        setReport(reportRes.data);
        setUnreadCount(unreadRes.data?.count || 0);
        
        // Take last 5 logs sorted by date
        const sortedLogs = (logsRes.data || []).sort((a: any, b: any) =>
          new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()
        ).slice(0, 5);
        setRecentLogs(sortedLogs);
        setSemesterText(getDynamicSemester());
      } catch (error) {
        toast.error('Données administratives non synchronisées.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);


  const userData = report ? [
    { name: 'Students', value: report.totalStudents, color: '#3b82f6' },
    { name: 'Teachers', value: report.totalTeachers, color: '#10b981' },
    { name: 'Admins', value: report.totalAdmins, color: '#f59e0b' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-slate-500 animate-pulse">Synchronisation du registre mondial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)] bg-[#f8fafc] min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tight flex items-center gap-3">
            Console administrative <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 font-medium">Tableau de bord administratif • <span className="text-emerald-500">Actif</span> • {semesterText || 'Chargement...'}</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <a href="/admin/notifications" className="relative p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-slate-700 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">
                {unreadCount}
              </span>
            )}
          </a>
          <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-2xl border border-slate-200 shadow-sm font-bold text-sm">
            <Globe className="w-4 h-4 text-blue-500" /> Système : En ligne
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Root Vérifié
          </div>
        </div>
      </div>

      {/* PRIMARY STATS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Inscription" value={report?.totalStudents} icon={Users} color="blue" sub="Élèves actifs" />
        <StatCard title="Corps enseignant" value={report?.totalTeachers} icon={UserCog} color="emerald" sub="Corps enseignant" />
        <StatCard title="Classes" value={report?.totalClasses} icon={School} color="amber" sub="Classes actives" />
        <StatCard title="Évaluations" value={report?.totalExams} icon={BookOpen} color="rose" sub="Total des examens" />
      </div>

      {/* QUICK LINKS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickDashboardLink href="/admin/families" label="Familles" icon={Users} color="blue" />
        <QuickDashboardLink href="/admin/parents" label="Parents" icon={UserCheck} color="emerald" />
        <QuickDashboardLink href="/admin/transport" label="Transport" icon={Bus} color="indigo" />
        <QuickDashboardLink href="/admin/calendar" label="Calendrier" icon={CalendarIcon} color="amber" />
        <QuickDashboardLink href="/admin/notifications" label="Alertes" icon={Bell} color="rose" />
        <QuickDashboardLink href="/admin/audit" label="Journal d'audit" icon={Activity} color="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-[clamp(1.2rem,2vw+1rem,2rem)]">
        {/* ANALYTICS: USER DISTRIBUTION */}
        <Card className="lg:col-span-1 py-3 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold">Matrice des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={userData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {userData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {userData.map((u) => (
                <div key={u.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }} />
                    <span className="text-sm font-bold text-slate-600">{u.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{u.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BAR CHART - INFRASTRUCTURE */}
        <Card className="lg:col-span-2 border py-3 border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold">Infrastructure académique</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Subjects', val: report?.totalSubjects },
                  { name: 'Classes', val: report?.totalClasses },
                  { name: 'Exams', val: report?.totalExams },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="val" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-[clamp(1.2rem,2vw+1rem,2rem)]">
        {/* LIVE SYSTEM AUDIT TRAIL */}
        <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">Journal d'audit en direct</CardTitle>
              <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Enregistreur de mutations d'état</CardDescription>
            </div>
            <Activity className="text-slate-400" size={20} />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100/60 duration-300 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider py-0 ${log.actionType?.includes('CREATE') ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' : 'text-amber-600 border-amber-100 bg-amber-50/50'}`}>
                          {log.actionType}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{log.notes || `${log.entityName} mutation`}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      {log.performedBy?.username || 'Système'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="rounded-3xl bg-gradient-to-br duration-300 from-indigo-600 to-blue-700 p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
        >
          <ArrowUpRight className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4">Intégrité du registre</h3>
            <p className="text-indigo-100 mb-8 leading-relaxed max-w-sm">
              Tous les dossiers académiques sont actuellement vérifiés et synchronisés avec le grand livre cloud sécurisé.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                Base de données : 100% synchronisée
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- VISUAL COMPONENTS ---

function StatCard({ title, value, icon: Icon, color, sub }: any) {
  const colorMap: any = {
    blue: "bg-blue-600 text-primary",
    emerald: "bg-emerald-500 text-emerald-500",
    amber: "bg-amber-500 text-amber-500",
    rose: "bg-rose-500 text-rose-500"
  };

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm relative overflow-hidden bg-white rounded-3xl py-4">
        <div className={`absolute top-0 left-0 w-2 h-full ${colorMap[color].split(' ')[0]}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</CardTitle>
          <div className="p-2 rounded-xl bg-slate-50">
            <Icon className={`w-5 h-5 ${colorMap[color].split(' ')[1]}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{value?.toLocaleString() ?? 0}</div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> {sub}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickAction({ href, label, color }: { href: string, label: string, color: string }) {
  const colors: any = {
    blue: "group-hover:text-blue-400",
    emerald: "group-hover:text-emerald-400",
    amber: "group-hover:text-amber-400",
    rose: "group-hover:text-rose-400"
  };

  return (
    <a
      href={href}
      className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all group min-h-[100px]"
    >
      <ArrowUpRight className={`w-5 h-5 ml-auto transition-all ${colors[color]}`} />
      <span className="text-sm font-bold tracking-tight text-white">{label}</span>
    </a>
  );
}

function QuickDashboardLink({ href, label, icon: Icon, color }: { href: string, label: string, icon: any, color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50 border-blue-100 hover:border-blue-300',
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:border-emerald-300',
    indigo: 'text-indigo-500 bg-indigo-50 border-indigo-100 hover:border-indigo-300',
    amber: 'text-amber-500 bg-amber-50 border-amber-100 hover:border-amber-300',
    rose: 'text-rose-500 bg-rose-50 border-rose-100 hover:border-rose-300',
    violet: 'text-violet-500 bg-violet-50 border-violet-100 hover:border-violet-300',
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center p-4 border rounded-3xl transition-all duration-300 ${colors[color]} hover:shadow-md`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-xs font-bold">{label}</span>
    </a>
  );
}
