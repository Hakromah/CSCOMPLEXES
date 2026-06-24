'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, X, Filter, AlertCircle, Info, CreditCard, GraduationCap, Calendar } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types/school';

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  ATTENDANCE: Calendar,
  FEE_REMINDER: CreditCard,
  PAYMENT: CreditCard,
  EXAM_RESULT: GraduationCap,
  HOMEWORK: GraduationCap,
  ANNOUNCEMENT: Info,
  EVENT: Calendar,
  BEHAVIOR: AlertCircle,
  SALARY: CreditCard,
  GENERAL: Bell,
};

const PRIORITY_STYLES: Record<string, { dot: string; ring: string }> = {
  LOW: { dot: 'bg-slate-400', ring: '' },
  NORMAL: { dot: 'bg-blue-500', ring: '' },
  HIGH: { dot: 'bg-orange-500', ring: 'ring-2 ring-orange-200' },
  URGENT: { dot: 'bg-red-500', ring: 'ring-2 ring-red-200' },
};

export default function ParentNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead, loading } = useNotifications();
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = notifications.filter(n => {
    if (showUnreadOnly && n.isRead) return false;
    if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
    return true;
  });

  const types: (NotificationType | 'ALL')[] = ['ALL', 'ATTENDANCE', 'FEE_REMINDER', 'PAYMENT', 'EXAM_RESULT', 'BEHAVIOR', 'ANNOUNCEMENT', 'EVENT', 'GENERAL'];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Inbox</p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showUnreadOnly ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" /> Unread
          </button>
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === t ? 'bg-primary text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
            }`}
          >
            {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
          <Bell className="w-12 h-12 opacity-30" />
          <p className="font-semibold">No notifications</p>
          {showUnreadOnly && <p className="text-xs">Toggle off &quot;Unread&quot; to see all notifications</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((n: Notification) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const priorityStyle = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.NORMAL;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className={`bg-white rounded-2xl border shadow-sm flex gap-4 p-4 transition-all cursor-pointer group ${
                    !n.isRead
                      ? `border-slate-200 ${priorityStyle.ring}`
                      : 'border-slate-100 opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${!n.isRead ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm truncate ${!n.isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.isRead && (
                          <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
                        )}
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500`}>{n.type.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded-lg ${n.priority === 'HIGH' || n.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                        {n.priority}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
