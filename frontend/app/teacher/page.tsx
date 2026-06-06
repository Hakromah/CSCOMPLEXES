/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen, Users, FileText, Globe, GraduationCap,
  Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, BarChart3, Search, User, X, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ classes: 0, students: 0, exams: 0, teacherName: '' });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- DATA CALCULATION ---
  const classPerformance = useMemo(() => {
    const performanceMap: Record<string, { total: number; count: number }> = {};
    resultsData.forEach((r: any) => {
      const className = r.exam?.classe?.name || 'Unknown';
      if (!performanceMap[className]) performanceMap[className] = { total: 0, count: 0 };
      performanceMap[className].total += r.marks;
      performanceMap[className].count += 1;
    });

    return Object.entries(performanceMap).map(([name, data]) => ({
      name,
      avg: parseFloat((data.total / data.count).toFixed(1))
    }));
  }, [resultsData]);

  // --- API FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [classesRes, examsRes, resultsRes, userRes] = await Promise.all([
          api.get('/teacher/classes'),
          api.get('/teacher/exams'),
          api.get('/teacher/results/filter'),
          api.get('/auth/me')
        ]);

        const classesList = Array.isArray(classesRes.data) ? classesRes.data : [];
        const examsList = Array.isArray(examsRes.data) ? examsRes.data : [];
        const resultsList = Array.isArray(resultsRes.data) ? resultsRes.data : [];

        const totalStudents = classesList.reduce((acc: number, curr: any) => acc + (curr.students?.length || 0), 0);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = examsList
          .filter((ex: any) => ex.date && new Date(ex.date) >= now)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);

        setStats({
          classes: classesList.length,
          students: totalStudents,
          exams: examsList.length,
          teacherName: userRes.data?.name || ''
        });
        setResultsData(resultsList);
        setRecentResults(resultsList.slice(0, 5));
        setUpcomingExams(upcoming);
      } catch (error) {
        console.error("Dashboard Sync Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return setSearchResults([]);
    setIsSearching(true);
    try {
      const res = await api.get(`/teacher/results/filter?studentId=${query}`);
      const uniqueStudents = Array.from(new Map(res.data.map((item: any) => [item?.student?.userId, item?.student])).values());
      setSearchResults(uniqueStudents);
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

      {/* --- RESTORED HERO SECTION WITH CORRECT GLOBAL MAP ANIMATION --- */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white min-h-[320px] flex items-center shadow-2xl">
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between md:items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/30">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              Registre Académique En Direct
            </div>
            <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black mb-2 tracking-tight">Bienvenue,</h1>
            <h2 className="text-[clamp(1.2rem,2.5vw+1rem,4rem)] text-blue-400 font-extrabold mb-4">{stats.teacherName || 'Éducateur'}</h2>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">Système synchronisé. Vous avez <span className="text-white font-bold">{stats.classes} classes</span> actives ce semestre.</p>
          </motion.div>

          <Button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-4 bg-white/10 md:hover:bg-white/20 border border-white/10 md:hover:border-white duration-500 rounded-2xl h-16 px-6 backdrop-blur-md transition-all group"
          >
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-blue-400 font-mono">Recherche dans le registre</p>
              <p className="text-sm font-bold text-white">Trouver un profil d'étudiant</p>
            </div>
            <Search className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          </Button>
        </div>

        {/* THE ANIMATION: Slow 180 Rotation */}
        <motion.div
          className="absolute right-[-5%] top-[-10%] opacity-20 pointer-events-none"
          animate={{ rotateY: 180 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        >
          <Globe size={550} className="text-blue-500" strokeWidth={0.5} />
        </motion.div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent z-0" />
      </div>

      {/* STATS GRID */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Classes Assignées', val: stats.classes, icon: BookOpen, color: 'bg-blue-600' },
          { label: 'Élèves Inscrits', val: stats.students, icon: Users, color: 'bg-emerald-500' },
          { label: 'Matériaux Académiques', val: stats.exams, icon: FileText, color: 'bg-amber-500' }
        ].map((item, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border border-slate-100 py-3 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${item.color}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</CardTitle>
                <item.icon className="h-4 w-4 text-slate-300" />
              </CardHeader>
              <CardContent><div className="text-4xl font-black text-slate-800">{loading ? "..." : item.val}</div></CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* RECENT ACTIVITY (recentResults Implemented) */}
        <Card className="lg:col-span-2 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pt-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <CardTitle className="text-[clamp(1rem,2vw+0.5rem,1.2rem)] font-bold">Activité Récente du Registre</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-bold" asChild>
              <a href="/teacher/results">Voir les logs <ArrowRight className="ml-1 w-3 h-3" /></a>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentResults.map((r, i) => (
              <div key={i} className="p-4 border-b border-slate-50 flex items-center justify-between md:hover:bg-blue-50/10 duration-500 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                    {(r.student?.username || r.student?.name || 'UN').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{r.student?.username || r.student?.name || 'Unknown Student'}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">{r.exam?.name || 'Unknown Exam'} • {r.exam?.term || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-8">
                  <div>
                    <p className="text-lg font-black text-slate-800">{r.marks}%</p>
                    <p className="text-[10px] font-bold text-primary uppercase text-right">{r.grade || 'Auto'}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-200" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* UPCOMING TIMELINE */}
        <div className="space-y-6">
          <Card className="border border-slate-100 py-3 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Calendrier à venir
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 w-full">
              {upcomingExams.map((ex, i) => (
                <div key={i} className={`p-3 rounded-xl border ${i === 0 ? 'bg-blue-600 text-white shadow-lg border-blue-700' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`text-[9px] font-black uppercase ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>{ex.term || 'Unknown Term'}</p>
                  <p className="text-sm font-bold truncate">{ex.name || 'Unnamed Exam'}</p>
                  <div className="flex justify-between mt-2 text-[10px] font-bold">
                    <span className="opacity-80">{ex.classe?.name || 'Class Unassigned'}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {ex.startTime || 'TBD'}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button className="h-14 flex sm:flex-col gap-1 bg-slate-800 md:hover:bg-primary duration-500 transition-colors" asChild>
              <a href="/teacher/results"><GraduationCap size={16} /><span className="text-[9px] font-black uppercase tracking-widest">SAISIE DES NOTES</span></a>
            </Button>
            <Button className="h-14 flex sm:flex-col gap-1 md:hover:bg-primary duration-500 transition-colors" asChild>
              <a href="/teacher/exams"><Calendar size={16} /><span className="text-[9px] font-black uppercase tracking-widest">EXAMENS</span></a>
            </Button>
          </div>
        </div>
      </div>

      {/* --- CLASS PERFORMANCE CHART (Implemented with COLORS) --- */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <CardTitle className="text-lg font-bold text-slate-700">Matrice de performance des classes</CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]} barSize={50}>
                  {classPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- GLOBAL SEARCH DIALOG (Fixed with DialogTitle) --- */}
      <AnimatePresence>
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-white rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 bg-slate-50 border-b">
              {/* Mandatory Title for Accessibility */}
              <DialogTitle className="sr-only">Recherche globale d'étudiant</DialogTitle>
              <div className="flex items-center gap-4">
                <Search className="w-6 h-6 text-primary" />
                <Input
                  autoFocus
                  placeholder="Trouver un élève par ID ou nom..."
                  className="text-xl border-none focus-visible:ring-0 bg-transparent p-0 font-medium"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}><X size={20} /></Button>}
              </div>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto p-4">
              {searchResults.length > 0 ? searchResults.map((s: any) => (
                <button key={s.userId} onClick={() => { setIsSearchOpen(false); window.location.href = `/teacher/results?studentId=${s.userId}` }} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-50 group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><User size={20} /></div>
                    <div className="text-left"><p className="font-bold text-slate-700">{s.name}</p><p className="text-xs text-slate-400 font-mono">{s.userId}</p></div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </button>
              )) : searchQuery.length > 1 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <AlertCircle size={32} strokeWidth={1} />
                  <p className="font-medium italic">Aucune correspondance trouvée pour <span>{searchQuery}</span></p>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} strokeWidth={1} className="text-blue-200" />
                  <p className="text-sm">Entrez les détails de l'élève pour rechercher dans le registre...</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-900 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Réseau d'intelligence 2CS</span>
              <span className="flex gap-4"><span>↵ Sélectionner</span><span>ESC Fermer</span></span>
            </div>
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </div>
  );
}

