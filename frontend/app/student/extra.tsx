/* eslint-disable @typescript-eslint/no-explicit-any */
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
   ChevronRight,
   Loader2
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
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
   const router = useRouter();
   const [stats, setStats] = useState({
      courseCount: 0,
      attendance: 0,
      materials: 0,
      averageGrade: 'N/A'
   });
   const [extras, setExtras] = useState({
      nextExam: null as any,
      recentActivities: [] as any[]
   });
   const [studentName, setStudentName] = useState('Student');
   const [loading, setLoading] = useState(true);

   const fetchDashboardData = async () => {
      try {
         const [statsRes, userRes, extrasRes] = await Promise.all([
            api.get('/api/student/dashboard-stats'),
            api.get('/api/auth/me'),
            api.get('/api/student/dashboard-extras')
         ]);
         setStats(statsRes.data);
         setStudentName(userRes.data.name);
         setExtras(extrasRes.data);
      } catch (error) {
         console.error("Dashboard sync error", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchDashboardData();
   }, []);

   if (loading) {
      return (
         <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#fcfcfd]">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Profile...</p>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#fcfcfd] p-6 lg:p-10 space-y-8">
         {/* Welcome Header */}
         <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">
                  Welcome back, <span className="text-primary">{(studentName || 'Student').split(' ')[0]}</span> 👋
               </h1>
               <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">
                  System Status: <span className="text-emerald-500">Active</span> • Term 2 Year 2026
               </p>
            </div>
            <div className="flex gap-3">
               <Button
                  onClick={() => router.push('/student/schedule')}
                  className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 md:hover:border-primary transition-colors duration-500 rounded-2xl px-6 h-12 font-bold shadow-sm"
               >
                  <CalendarIcon size={18} className="mr-2 text-primary" />
                  Schedule
               </Button>
            </div>
         </header>

         {/* Stats Grid */}
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
               { label: 'Active Courses', value: stats.courseCount, icon: BookOpen, color: 'text-primary', bg: 'bg-blue-50' },
               { label: 'Attendance', value: `${stats.attendance}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Resources', value: stats.materials, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
               { label: 'Avg. Grade', value: stats.averageGrade, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((item, i) => (
               <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
               >
                  <Card className="border border-slate-100 md:hover:border-primary duration-500 shadow-sm rounded-4 overflow-hidden bg-white group hover:shadow-md transition-all">
                     <CardContent className="p-6">
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
            <Card className="lg:col-span-2 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-[2.5rem] bg-white p-8">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Attendance Pulse</h2>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Consistency Tracker</p>
                  </div>
                  <TrendingUp className="text-emerald-500" />
               </div>
               <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[{ day: 'Mon', value: 85 }, { day: 'Tue', value: 90 }, { day: 'Wed', value: 70 }, { day: 'Thu', value: stats.attendance }, { day: 'Fri', value: 100 }]}>
                        <defs>
                           <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                        <YAxis hide domain={[0, 100]} />
                        <ReTooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            {/* Sidebar Info - INTEGRATED DYNAMIC DATA */}
            <div className="space-y-6">
               <Card className="border border-slate-800 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-8 overflow-hidden relative group">
                  <div className="relative z-10">
                     <h2 className="text-lg font-black uppercase tracking-widest mb-4 italic">Exam Reminder</h2>
                     {extras.nextExam ? (
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
                           <div className="bg-primary p-3 rounded-2xl">
                              <Clock size={20} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest truncate w-32">{extras.nextExam.name}</p>
                              <p className="text-sm font-medium">{extras.nextExam.date} • {extras.nextExam.startTime}</p>
                           </div>
                        </div>
                     ) : (
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-slate-400 text-xs italic">
                           No upcoming assessments found.
                        </div>
                     )}
                     <Button
                        onClick={() => router.push('/student/exams')}
                        className="w-full mt-6 bg-white text-slate-900 md:hover:bg-primary md:hover:text-white duration-500 rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest transition-all"
                     >
                        GO TO EXAM HUB
                     </Button>
                  </div>
                  <BookOpen className="absolute -right-8 -bottom-8 text-white/5" size={180} />
               </Card>

               <Card className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-[2.5rem] bg-white p-8">
                  <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Recent Activity</h2>
                  <div className="space-y-6">
                     {extras.recentActivities.length > 0 ? (
                        extras.recentActivities.map((activity: any, i: number) => (
                           <div
                              key={i}
                              className="flex items-center justify-between group cursor-pointer"
                              onClick={() => router.push(activity.type === 'file' ? '/student/materials' : '/student/results')}
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`w-2 h-2 rounded-full ${activity.type === 'grade' ? 'bg-emerald-500' : 'bg-primary'} ring-4 ${activity.type === 'grade' ? 'ring-emerald-50' : 'ring-blue-50'}`} />
                                 <div>
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">{activity.title}</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase">{activity.time}</p>
                                 </div>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                           </div>
                        ))
                     ) : (
                        <div className="text-center py-4">
                           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No recent updates</p>
                        </div>
                     )}
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
}
