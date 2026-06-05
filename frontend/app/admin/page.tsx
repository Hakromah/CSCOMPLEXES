/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, School, BookOpen, FileText, UserCog,
  BarChart3, ShieldCheck, Activity, ArrowUpRight,
  TrendingUp, Globe, Database
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get('/admin/reports/summary');
        setReport(response.data);
      } catch (error) {
        toast.error('Failed to sync administrative data');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
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
          <p className="font-bold text-slate-500 animate-pulse">Synchronizing Global Registry...</p>
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
            Admin Console <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 font-medium">Global Administrative Control Panel</p>
        </motion.div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-2xl border border-slate-200 shadow-sm font-bold text-sm">
            <Globe className="w-4 h-4 text-blue-500" /> System: Online
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Root Verified
          </div>
        </div>
      </div>

      {/* PRIMARY STATS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Enrollment" value={report?.totalStudents} icon={Users} color="blue" sub="Active Students" />
        <StatCard title="Faculty" value={report?.totalTeachers} icon={UserCog} color="emerald" sub="Teaching Staff" />
        <StatCard title="Classrooms" value={report?.totalClasses} icon={School} color="amber" sub="Active Classes" />
        <StatCard title="Assessments" value={report?.totalExams} icon={BookOpen} color="rose" sub="Total Exams" />
      </div>

      <div className="grid lg:grid-cols-3 gap-[clamp(1.2rem,2vw+1rem,2rem)]">
        {/* ANALYTICS: USER DISTRIBUTION */}
        <Card className="lg:col-span-1 py-3 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold">User Matrix</CardTitle>
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
            <CardTitle className="text-lg font-bold">Academic Infrastructure</CardTitle>
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
        <Card className="border border-slate-800 py-5 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-slate-900 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Management Quick-Links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <QuickAction href="/admin/users" label="User Audit" color="blue" />
            <QuickAction href="/admin/timetable" label="Schedules" color="emerald" />
            <QuickAction href="/admin/reports" label="Analytics" color="amber" />
            <QuickAction href="/admin/settings" label="Network" color="rose" />
          </CardContent>
        </Card>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="rounded-3xl bg-gradient-to-br duration-300 from-indigo-600 to-blue-700 p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
        >
          <ArrowUpRight className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4">Registry Integrity</h3>
            <p className="text-indigo-100 mb-8 leading-relaxed max-w-sm">
              All academic records are currently verified and synchronized with the secure cloud ledger.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                Database: 100% Synced
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

// 'use client';

// import { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Users, School, BookOpen, FileText } from 'lucide-react';
// import { toast } from 'sonner';
// import api from '@/lib/api';

// interface ReportDTO {
//   totalStudents: number;
//   totalTeachers: number;
//   totalAdmins: number;
//   totalClasses: number;
//   totalExams: number;
//   totalSubjects: number;
// }

// export default function AdminDashboard() {
//   const [report, setReport] = useState<ReportDTO | null>(null);

//   useEffect(() => {
//     const fetchReport = async () => {
//       try {
//         const response = await api.get('/admin/reports/summary');
//         setReport(response.data);
//       } catch (error) {
//         toast.error('Failed to fetch dashboard data');
//         console.log(error);
//       }
//     };

//     fetchReport();
//   }, []);

//   if (!report) {
//     return <div className="p-8">Loading dashboard...</div>;
//   }

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
//       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Students
//             </CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{report.totalStudents}</div>
//             <p className="text-xs text-muted-foreground">
//               Active students
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Teachers
//             </CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{report.totalTeachers}</div>
//             <p className="text-xs text-muted-foreground">
//               Active teachers
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
//             <School className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{report.totalClasses}</div>
//             <p className="text-xs text-muted-foreground">
//               Active classes
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Exams
//             </CardTitle>
//             <BookOpen className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{report.totalExams}</div>
//             <p className="text-xs text-muted-foreground">
//               Scheduled exams
//             </p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Subjects
//             </CardTitle>
//             <FileText className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{report.totalSubjects}</div>
//             <p className="text-xs text-muted-foreground">
//               Active subjects
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
