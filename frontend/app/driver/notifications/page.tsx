'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverNotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success('All notifications marked as read');
  };

  const handleMarkRead = async (id: number) => {
    await markAsRead(id);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Notification Feed...</p>
      </div>
    );
  }

  const PRIORITY_COLOR: Record<string, string> = {
    LOW: 'border-slate-100 bg-slate-50',
    NORMAL: 'border-slate-100 bg-white',
    HIGH: 'border-amber-100 bg-amber-50/10',
    URGENT: 'border-rose-100 bg-rose-50/10',
  };

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Bell size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Alert System</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Notifications <span className="text-primary">Hub.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Check direct logs, route updates, administration messages, and system alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-12 px-6 font-black transition-all cursor-pointer shadow-md"
          >
            <CheckCheck size={16} className="mr-2" /> Mark All as Read
          </Button>
        )}
      </header>

      {/* Unread Indicator Badge */}
      {unreadCount > 0 && (
        <div className="bg-primary/10 text-primary border border-primary/20 rounded-2xl px-6 py-4 flex items-center justify-between">
          <p className="text-xs font-bold">
            You have <span className="font-black text-sm">{unreadCount}</span> unread notifications requiring your attention.
          </p>
        </div>
      )}

      {/* Notification items */}
      {notifications.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <Bell className="mx-auto text-slate-200" size={60} />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inbox Clean</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md mx-auto">
            You don't have any notifications logged at this moment. You're completely up to date!
          </p>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {notifications.map((notif) => {
            const cardBg = PRIORITY_COLOR[notif.priority] || PRIORITY_COLOR.NORMAL;
            return (
              <Card
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={`border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-start gap-4 cursor-pointer relative ${cardBg} ${
                  !notif.isRead ? 'ring-2 ring-primary/10 font-bold' : ''
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-primary" />
                )}

                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Bell size={18} />
                </div>

                <div className="flex-1 space-y-2 pr-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full">
                      {notif.type}
                    </Badge>
                    {notif.priority !== 'NORMAL' && (
                      <Badge className={`border-none font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full ${
                        notif.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {notif.priority}
                      </Badge>
                    )}
                    <span className="text-[9px] font-bold text-slate-400">
                      {new Date(notif.createdAt || '').toLocaleDateString()} at {new Date(notif.createdAt || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <h3 className={`text-sm tracking-tight text-slate-900 ${!notif.isRead ? 'font-black' : 'font-bold'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {notif.body}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
