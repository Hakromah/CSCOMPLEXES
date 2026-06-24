'use client';

import React, { useState, useEffect } from 'react';
import { useMessages } from '@/lib/hooks/useMessages';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Send, Inbox, Trash2, Reply, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function AdminMessagesPage() {
  const { inbox, sent, unreadCount, loading, sendMessage, replyToMessage, markAsRead, deleteMessage } = useMessages();
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyBody, setReplyBody] = useState('');
  const [openCompose, setOpenCompose] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newRecipientId, setNewRecipientId] = useState('');

  // Fetch recipients (all users except self)
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const [usersRes, meRes] = await Promise.all([
          api.get('/users?pagination[limit]=100'),
          api.get('/auth/me')
        ]);
        const list = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.results || []);
        const myId = meRes.data.id;
        setRecipients(list.filter((u: any) => u.id !== myId));
      } catch (err) {
        console.error('Failed to load user list', err);
      }
    };
    fetchRecipients();
  }, []);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientId || !newSubject || !newBody) {
      toast.error('All fields are required');
      return;
    }
    try {
      await sendMessage({
        recipientId: Number(newRecipientId),
        subject: newSubject,
        body: newBody,
      });
      toast.success('Message sent successfully');
      setNewSubject('');
      setNewBody('');
      setNewRecipientId('');
      setOpenCompose(false);
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    try {
      await replyToMessage(selectedMessage.id, replyBody);
      toast.success('Reply sent successfully');
      setReplyBody('');
      setSelectedMessage(null);
    } catch {
      toast.error('Failed to reply');
    }
  };

  const handleSelectMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (tab === 'inbox' && !msg.isReadByRecipient) {
      await markAsRead(msg.id);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(id);
      toast.success('Message deleted');
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch {
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Inbox...</p>
      </div>
    );
  }

  const list = tab === 'inbox' ? inbox : sent;

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail size={18} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Message Center</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Internal <span className="text-primary">Mailbox.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Send secure communications to teachers, accountants, and parent users
          </p>
        </div>

        <Dialog open={openCompose} onOpenChange={setOpenCompose}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-600 text-white rounded-2xl h-12 px-6 font-black transition-all cursor-pointer shadow-md">
              <Plus size={16} className="mr-2" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-2xl bg-white max-w-lg p-8">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
                Compose Message
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCompose} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recipient</label>
                <select
                  value={newRecipientId}
                  onChange={(e) => setNewRecipientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 h-11 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-colors"
                  required
                >
                  <option value="">Select Recipient...</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.username} ({r.schoolRole})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Subject</label>
                <Input
                  type="text"
                  placeholder="Enter message subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="rounded-xl border border-slate-200 h-11 text-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Message Body</label>
                <textarea
                  placeholder="Type your message here..."
                  value={newBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBody(e.target.value)}
                  className="rounded-2xl border border-slate-200 min-h-[120px] text-sm font-bold w-full p-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-primary text-white rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer"
              >
                Send Message <Send size={12} className="ml-2" />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Tabs */}
      <div className="flex gap-3">
        <Button
          onClick={() => { setTab('inbox'); setSelectedMessage(null); }}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'inbox' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Inbox size={13} /> Inbox {unreadCount > 0 && <Badge className="bg-rose-500 text-white">{unreadCount}</Badge>}
        </Button>
        <Button
          onClick={() => { setTab('sent'); setSelectedMessage(null); }}
          className={`rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-10 gap-2 transition-all cursor-pointer ${
            tab === 'sent' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Send size={13} /> Sent
        </Button>
      </div>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Messages List */}
        <Card className="lg:col-span-1 border border-slate-100 rounded-3xl bg-white shadow-sm overflow-hidden min-h-[500px]">
          <CardHeader className="border-b border-slate-50 px-6 py-4 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {tab === 'inbox' ? 'Inbox Messages' : 'Sent Messages'}
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-50 overflow-y-auto max-h-[600px]">
            {list.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs">
                No messages found.
              </div>
            ) : (
              list.map((msg: any) => {
                const isUnread = tab === 'inbox' && !msg.isReadByRecipient;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-6 cursor-pointer hover:bg-slate-50 transition-colors relative flex flex-col gap-2 ${
                      isUnread ? 'bg-blue-50/20 font-black' : ''
                    } ${selectedMessage?.id === msg.id ? 'bg-slate-50 border-r-4 border-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start pr-4">
                      <span className="text-xs font-black text-slate-900 tracking-tight">
                        {tab === 'inbox' 
                          ? (msg.sender?.firstName && msg.sender?.lastName ? `${msg.sender.firstName} ${msg.sender.lastName}` : msg.sender?.username || 'System') 
                          : (msg.recipient?.firstName && msg.recipient?.lastName ? `${msg.recipient.firstName} ${msg.recipient.lastName}` : msg.recipient?.username || 'User')}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-bold tracking-tight truncate">{msg.subject}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{msg.body}</p>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(msg.id, e)}
                      className="absolute right-4 bottom-4 h-8 w-8 p-0 text-slate-300 hover:text-rose-600 rounded-xl"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Message Details */}
        <Card className="lg:col-span-2 border border-slate-100 rounded-3xl bg-white shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Message Header */}
              <div className="p-8 border-b border-slate-50 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedMessage.subject}</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      From: <span className="text-slate-800">{selectedMessage.sender?.firstName && selectedMessage.sender?.lastName ? `${selectedMessage.sender.firstName} ${selectedMessage.sender.lastName}` : selectedMessage.sender?.username}</span> • To: <span className="text-slate-800">{selectedMessage.recipient?.firstName && selectedMessage.recipient?.lastName ? `${selectedMessage.recipient.firstName} ${selectedMessage.recipient.lastName}` : selectedMessage.recipient?.username}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </Badge>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-8 flex-1 overflow-y-auto">
                <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.body}
                </p>
              </div>

              {/* Reply Form */}
              {tab === 'inbox' && (
                <form onSubmit={handleReply} className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3 items-end">
                  <textarea
                    placeholder="Type your reply here..."
                    value={replyBody}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyBody(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white min-h-[60px] text-xs font-bold p-4 outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-slate-900 hover:bg-primary text-white rounded-2xl h-12 w-12 p-0 flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <Reply size={16} />
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-12">
              <Mail size={40} className="text-slate-200" />
              <p className="text-xs font-bold uppercase tracking-widest">Select a message to view detail</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
