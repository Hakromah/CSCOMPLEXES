'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Send, Search, Plus, X, Globe, User, Radio, FileText,
  Clock, CheckCircle, Info, ShieldCheck, MailWarning, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // Form states
  const [sendData, setSendData] = useState({
    title: '',
    body: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    recipientId: '',
    actionUrl: '',
  });

  const [broadcastData, setBroadcastData] = useState({
    title: '',
    body: '',
    type: 'ANNOUNCEMENT',
    priority: 'HIGH',
    role: 'ALL', // ALL means all users
  });

  const fetchNotifications = async () => {
    try {
      // In Admin, we want to view a history of notifications or general notifications
      const res = await api.get('/notifications?pagination[limit]=100');
      setNotifications(res.data?.notifications || res.data || []);
    } catch (err) {
      toast.error('Failed to sync notification history');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.map((u: any) => ({ ...u, name: u.username || u.name })) || []);
    } catch (err) {
      console.error('Failed to fetch users list', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchNotifications(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendData.recipientId || !sendData.title || !sendData.body) {
      return toast.error('Recipient, Title, and Message Body are required');
    }

    try {
      const payload = {
        ...sendData,
        recipientId: Number(sendData.recipientId)
      };

      await api.post('/admin/notifications/send', payload);
      toast.success('Notification dispatched successfully');
      setIsSendOpen(false);
      resetSendForm();
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.body) {
      return toast.error('Title and Announcement Body are required');
    }

    try {
      const payload = {
        ...broadcastData,
        role: broadcastData.role === 'ALL' ? undefined : (broadcastData.role || undefined)
      };

      const res = await api.post('/admin/notifications/broadcast', payload);
      toast.success(`Broadcast announcement dispatched to ${res.data.count || 0} users`);
      setIsBroadcastOpen(false);
      resetBroadcastForm();
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to broadcast announcement');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to retract/delete this notification?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notification retracted');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const resetSendForm = () => {
    setSendData({
      title: '',
      body: '',
      type: 'GENERAL',
      priority: 'NORMAL',
      recipientId: '',
      actionUrl: '',
    });
  };

  const resetBroadcastForm = () => {
    setBroadcastData({
      title: '',
      body: '',
      type: 'ANNOUNCEMENT',
      priority: 'HIGH',
      role: 'ALL',
    });
  };

  const filteredNotifications = notifications.filter((n) =>
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.body || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.recipient?.username || n.recipient?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Bell size={32} className="text-primary" />
            System Notifications Center
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Dispatch individual notifications, broadcast school-wide announcements, and monitor logs
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { resetSendForm(); setIsSendOpen(true); }} variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-750 rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
            <User size={18} />
            Direct Message
          </Button>
          <Button onClick={() => { resetBroadcastForm(); setIsBroadcastOpen(true); }} className="bg-primary hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-sm flex items-center gap-2">
            <Radio size={18} className="animate-pulse" />
            Broadcast Announcement
          </Button>
        </div>
      </header>

      {/* Main Table */}
      <Card className="rounded-3xl border border-transparent shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800">
            Notification Dispatch Logs
          </CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing dispatch logs...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No notifications dispatched yet
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6">Recipient</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Message Content</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Type & Priority</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Sent Date</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((n) => (
                  <TableRow key={n.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      {n.recipient ? (
                        <div>
                          <p className="font-bold text-slate-900">{n.recipient?.username || n.recipient?.name}</p>
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-wider text-slate-400 border-slate-100 bg-slate-50 mt-1">
                            {n.recipient?.schoolRole}
                          </Badge>
                        </div>
                      ) : (
                        <Badge className="bg-blue-50 border border-blue-100 text-primary font-bold text-[10px]">
                          Broadcasting / Broadcasted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-md truncate">{n.body}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider ${n.type === 'ANNOUNCEMENT' ? 'text-blue-600 border-blue-100 bg-blue-50/50' : 'text-slate-500 border-slate-100 bg-slate-50/50'}`}>
                          {n.type}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] font-black uppercase py-0 ${n.priority === 'HIGH' || n.priority === 'URGENT' ? 'text-red-500 bg-red-50' : 'text-slate-400 bg-slate-100'}`}>
                          {n.priority}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {n.isRead ? (
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-0.5">
                          <CheckCircle size={10} /> Read ({new Date(n.readAt).toLocaleDateString()})
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-0.5">
                          <Info size={10} /> Unread
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(n.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={isSendOpen} onOpenChange={(open) => { if (!open) { setIsSendOpen(false); resetSendForm(); } }}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Send className="text-primary" />
              Send Direct Notification
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendNotification} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Recipient</label>
              <Select onValueChange={(val) => setSendData({ ...sendData, recipientId: val })} value={sendData.recipientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Search / Select user" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.schoolRole})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Notification Title</label>
              <Input
                required
                placeholder="e.g. Action Required: Document Verification"
                value={sendData.title}
                onChange={(e) => setSendData({ ...sendData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Notification Message Body</label>
              <textarea
                required
                rows={3}
                placeholder="Message body details..."
                value={sendData.body}
                onChange={(e) => setSendData({ ...sendData, body: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Category</label>
                <Select onValueChange={(val) => setSendData({ ...sendData, type: val })} value={sendData.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="FEE_REMINDER">Fee Reminder</SelectItem>
                    <SelectItem value="PAYMENT">Payment Update</SelectItem>
                    <SelectItem value="BEHAVIOR">Behavior Log</SelectItem>
                    <SelectItem value="HOMEWORK">Homework Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Priority</label>
                <Select onValueChange={(val) => setSendData({ ...sendData, priority: val })} value={sendData.priority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Action URL / Redirection (Optional)</label>
              <Input
                placeholder="e.g. /parent/finance"
                value={sendData.actionUrl}
                onChange={(e) => setSendData({ ...sendData, actionUrl: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsSendOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Dispatch Message</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={isBroadcastOpen} onOpenChange={(open) => { if (!open) { setIsBroadcastOpen(false); resetBroadcastForm(); } }}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Radio className="text-primary animate-pulse" />
              Broadcast Announcement
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Target User Group / Role</label>
              <Select onValueChange={(val) => setBroadcastData({ ...broadcastData, role: val })} value={broadcastData.role}>
                <SelectTrigger>
                  <SelectValue placeholder="Broadcast to all users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Portal Users (Broadcast)</SelectItem>
                  <SelectItem value="STUDENT">Students Only</SelectItem>
                  <SelectItem value="TEACHER">Teachers Only</SelectItem>
                  <SelectItem value="PARENT">Parents Only</SelectItem>
                  <SelectItem value="DRIVER">Drivers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Announcement Title</label>
              <Input
                required
                placeholder="e.g. Public Announcement: Campus Closure Tomorrow"
                value={broadcastData.title}
                onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Announcement Body</label>
              <textarea
                required
                rows={4}
                placeholder="Write announcement details..."
                value={broadcastData.body}
                onChange={(e) => setBroadcastData({ ...broadcastData, body: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsBroadcastOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-blue-700 text-white rounded-xl">Broadcast Now</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
