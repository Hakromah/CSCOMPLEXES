'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users, CreditCard, Bell, Calendar, ChevronRight,
  TrendingUp, FileText, MessageSquare, Clock, AlertCircle,
  CheckCircle2, BookOpen, GraduationCap, Bus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useNotifications } from '@/lib/hooks/useNotifications';
import type { ParentDashboardStats, SchoolEvent, Notification } from '@/types/school';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface AttendanceChartData {
  day: string;
  present: number;
  absent: number;
}

export default function ParentDashboardPage() {
  const [stats, setStats] = useState<ParentDashboardStats | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceChartData[]>(
    DAYS.map(day => ({ day, present: 0, absent: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState('');
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [meRes, statsRes, eventsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/parent/dashboard').catch(() => ({ data: null })),
          api.get('/calendar/events').catch(() => ({ data: [] })),
        ]);

        setParentName(meRes.data?.firstName || meRes.data?.username || 'Parent');

        if (statsRes.data) {
          setStats(statsRes.data);
          if (statsRes.data.children?.length > 0) {
            setSelectedChildId(statsRes.data.children[0].id);
          }
        }
        setEvents((eventsRes.data || []).slice(0, 5));
      } catch {
        setParentName('Parent');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    const loadAttendance = async () => {
      try {
        const res = await api.get(`/parent/children/${selectedChildId}/attendance`);
        const records = res.data?.records || [];
        const map: Record<string, AttendanceChartData> = {};
        DAYS.forEach(d => (map[d] = { day: d, present: 0, absent: 0 }));
        records.forEach((r: { session?: { date?: string }; status: string }) => {
          const date = new Date(r.session?.date || '');
          const dayIdx = date.getDay();
          if (dayIdx >= 1 && dayIdx <= 5) {
            const dayName = DAYS[dayIdx - 1];
            if (r.status === 'PRESENT') map[dayName].present++;
            else if (r.status === 'ABSENT') map[dayName].absent++;
          }
        });
        setAttendanceData(DAYS.map(d => map[d]));
      } catch { /* no-op */ }
    };
    loadAttendance();
  }, [selectedChildId]);

  const kpiCards = [
    {
      label: 'My Children',
      value: stats?.totalChildren ?? 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      href: '/parent/children',
    },
    {
      label: 'Outstanding Balance',
      value: stats?.outstandingBalance ? `GNF ${stats.outstandingBalance.toLocaleString()}` : 'GNF 0',
      icon: CreditCard,
      color: stats?.outstandingBalance ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600',
      href: '/parent/finance',
    },
    {
      label: 'Notifications',
      value: unreadCount,
      icon: Bell,
      color: 'bg-amber-50 text-amber-600',
      href: '/parent/notifications',
    },
    {
      label: 'Upcoming Exams',
      value: stats?.upcomingExams ?? 0,
      icon: GraduationCap,
      color: 'bg-purple-50 text-purple-600',
      href: selectedChildId ? `/parent/children/${selectedChildId}/exams` : '/parent/children',
    },
  ];

  const quickActions = [
    { label: 'View Report Card', icon: FileText, href: selectedChildId ? `/parent/children/${selectedChildId}/results` : '/parent/children' },
    { label: 'Download Statement', icon: CreditCard, href: '/parent/finance' },
    { label: 'Message Teacher', icon: MessageSquare, href: '/parent/messages' },
    { label: 'View Timetable', icon: Clock, href: selectedChildId ? `/parent/children/${selectedChildId}/timetable` : '/parent/children' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Parent Portal</p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">
            Welcome back, <span className="text-primary italic">{parentName}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Child Switcher */}
        {stats && stats.children.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2">
            <span className="text-xs text-slate-500 font-semibold px-2">Viewing:</span>
            {stats.children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedChildId === child.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                {child.firstName || child.username}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={card.href}>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:border-primary transition-colors duration-300 group cursor-pointer">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 truncate">{card.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5 truncate">{card.value}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Weekly Overview</p>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">Attendance This Week</h2>
            </div>
            {selectedChildId && (
              <Link
                href={`/parent/children/${selectedChildId}/attendance`}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
              />
              <Area type="monotone" dataKey="present" stroke="#2563eb" strokeWidth={2} fill="url(#presentGrad)" name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fill="url(#absentGrad)" name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">School</p>
              <h2 className="text-lg font-black text-slate-900">Upcoming Events</h2>
            </div>
            <Link href="/parent/calendar" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Calendar className="w-8 h-8 opacity-30" />
                <p className="text-xs font-medium">No upcoming events</p>
              </div>
            ) : (
              events.slice(0, 4).map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Notifications + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Inbox</p>
              <h2 className="text-lg font-black text-slate-900">Recent Notifications</h2>
            </div>
            <Link href="/parent/notifications" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="flex flex-col gap-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-xs font-medium">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n: Notification) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    !n.isRead ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${!n.isRead ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {n.priority === 'HIGH' || n.priority === 'URGENT'
                      ? <AlertCircle className="w-3.5 h-3.5" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{n.body}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-slate-900 rounded-2xl p-6 text-white"
        >
          <div className="mb-6">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Quick Access</p>
            <h2 className="text-lg font-black mt-0.5">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => (
              <Link key={idx} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-primary/30 border border-white/10 hover:border-primary/50 rounded-2xl transition-all duration-300 cursor-pointer group">
                  <div className="p-3 rounded-xl bg-white/10 group-hover:bg-primary/20">
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-center text-slate-300 group-hover:text-white transition-colors leading-tight">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400">
              {stats?.totalChildren ? `Managing ${stats.totalChildren} child${stats.totalChildren > 1 ? 'ren' : ''}` : 'No children linked yet'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
